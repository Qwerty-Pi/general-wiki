function cleanTeamName(name) {
    // Member lists in brackets are metadata, rather than part of the name.
    let previous;
    do {
        previous = name;
        name = name.replace(/\([^()]*\)|\[[^\[\]]*\]|（[^（）]*）|【[^【】]*】/g, '');
    } while (name !== previous);
    return name.replace(/\s+/g, ' ').trim();
}

// Assign missing colours once when loading, so they stay stable during replay.
function getTaskColours(tasks, balloons = {}) {
    const entries = tasks.map(task => {
        const colour = balloons?.[task];
        const details = typeof colour === 'string' ? { background_color: colour } : (colour ?? {});
        return [task, { ...details }];
    });
    const missing = entries.filter(([, details]) => !details.background_color);
    const startHue = Math.random() * 360;
    missing.forEach(([, details], index) => {
        const hue = (startHue + index * 360 / missing.length) % 360;
        // Separate hues evenly and alternate lightness for neighbouring tasks.
        details.background_color = `hsl(${hue.toFixed(1)} 85% ${index % 2 === 0 ? 65 : 45}%)`;
    });
    return Object.fromEntries(entries);
}

// written by gemini
function parseIcpcDat(datContent) {
    let contestName = "Contest";
    const tasks = [];
    let duration = 18000;
    let freeze = 3600;
    const teams = {};
    const submissions = [];

    const lines = datContent.split(/\r?\n/);

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith("@contest")) {
            const match = line.match(/@contest\s+"([^"]+)"|@contest\s+(.+)/);
            if (match) contestName = match[1] || match[2];
        } 
        else if (line.startsWith("@contlen")) {
            const parts = line.split(/\s+/);
            if (parts.length > 1) {
                const val = parseInt(parts[1], 10);
                duration = val < 1000 ? val * 60 : val;
            }
        } 
        else if (line.startsWith("@freeze")) {
            const parts = line.split(/\s+/);
            if (parts.length > 1) {
                const val = parseInt(parts[1], 10);
                freeze = val < 1000 ? val * 60 : val;
            }
        } 
        else if (line.startsWith("@p ")) {
            const payload = line.substring(3).trim();
            const taskLetter = payload.split(",")[0].trim();
            if (taskLetter && !tasks.includes(taskLetter)) {
                tasks.push(taskLetter);
            }
        } 
        else if (line.startsWith("@t ")) {
            const match = line.match(/@t\s+(\d+),[^"]*"([^"]+)"/);
            if (match) {
                const tId = match[1];
                const fullStr = match[2].trim();
                const parts = fullStr.split("-").map(p => p.trim()).filter(p => p);
                
                let univ, teamName;
                if (parts.length >= 2) {
                    univ = parts[0];
                    teamName = parts[1];
                } else if (parts.length === 1) {
                    univ = parts[0];
                    teamName = parts[0];
                } else {
                    univ = tId;
                    teamName = tId;
                }
                teams[tId] = { univ, teamName: cleanTeamName(teamName) };
            }
        } 
        else if (line.startsWith("@s ") || line.startsWith("@run")) {
            const spaceIndex = line.indexOf(' ');
            if (spaceIndex !== -1) {
                const payload = line.substring(spaceIndex + 1).trim();
                const parts = payload.split(",").map(p => p.trim());
                
                if (parts.length >= 5) {
                    const tId = parts[0];
                    const task = parts[1];
                    const timeSec = parseInt(parts[3], 10);
                    const status = parts[4].toUpperCase();

                    const teamInfo = teams[tId] || { univ: tId, teamName: tId };
                    const verdict = ["OK", "AC", "1"].includes(status) ? "accepted" : "rejected";

                    submissions.push({
                        university: teamInfo.univ,
                        team: teamInfo.teamName,
                        task: task,
                        verdict: verdict,
                        time: timeSec
                    });
                }
            }
        }
    }

    return {
        name: contestName,
        tasks: tasks,
        balloons: getTaskColours(tasks),
        duration: duration,
        freeze: freeze,
        submissions: submissions
    };
}


async function fetchXCPCData(contestId) {
    // sus website, but temporarily use this first
    const corsproxyurl = "https://corsproxy.io/?key=eb06d979";
    const contesturl = `https://board.xcpcio.com/data/${contestId}/`;
    const baseurl = corsproxyurl + "&url=" + contesturl.replaceAll("/", "%2F").replaceAll(":", "%3A");
    const urls = {
        team: `${baseurl}team.json`,
        config: `${baseurl}config.json`,
        run: `${baseurl}run.json`,
        orgs: `${baseurl}organizations.json`
    };

    // 1. Fetch all datasets concurrently
    const [teamData, configData, runData, orgsData] = await Promise.all([
        fetch(urls.team).then(res => res.json()),
        fetch(urls.config).then(res => res.json()),
        fetch(urls.run).then(res => res.json()),
        fetch(urls.orgs).then(res => res.ok ? res.json() : {})
    ]);

    // 2. Map Organizations (org_id -> Name)
    const orgMap = {};
    const orgList = Array.isArray(orgsData) ? orgsData : Object.values(orgsData);
    orgList.forEach(org => {
        const id = org.organization_id || org.id;
        orgMap[id] = org.name || org.school || id;
    });

    // 3. Map Teams (team_id -> { university, teamName })
    const teamMap = {};
    const teamsList = Array.isArray(teamData) ? teamData : Object.values(teamData);
    teamsList.forEach(t => {
        const tId = String(t.team_id !== undefined ? t.team_id : t.id);
        const orgId = t.organization_id || t.organization || t.school;
        const univ = orgMap[orgId] || orgId || tId;
        let teamName = t.name || t.team_name || tId;

        if (typeof teamName === 'object') {
            teamName = teamName.texts[teamName.fallback_lang];
        }
        
        teamMap[tId] = { univ, teamName: cleanTeamName(teamName) };
    });

    // 4. Extract Config Metadata
    let contestName = configData.contest_name || configData.title || configData.name || "Contest";
    if (typeof contestName === 'object') {
        contestName = contestName.texts[contestName.fallback_lang];
    }
    let tasks = [];
    tasks = configData.problems.map(p => typeof p === 'string' ? p : (p.label || p.id || p.name));

    let balloons = {};
    configData.problems.forEach(function (data, index) {
        balloons[tasks[index]] = data.balloon_color;
    })

    const duration = configData.duration || configData.contest_duration || 18000;
    const freeze = configData.freeze_time || configData.freeze_duration || 3600;

    // 5. Reformat Submissions/Runs
    const runsList = Array.isArray(runData) ? runData : (runData.runs || Object.values(runData));
    const submissions = runsList.map(run => {
        const tId = String(run.team_id);
        const teamInfo = teamMap[tId] || { univ: tId, teamName: tId };

        // Resolve problem letter/id
        let task = run.problem_id !== undefined ? run.problem_id : run.problem;
        task = tasks[task]; // assert task is integer from xcpc

        // Determine verdict status
        const rawStatus = String(run.status || run.result || run.verdict || '').toUpperCase();
        const verdict = ["OK", "AC", "CORRECT", "ACCEPTED", "1"].includes(rawStatus) ? "accepted" : "rejected";

        // Convert timestamp to seconds if provided in milliseconds
        let timeSec = run.timestamp || run.time || run.submission_time || 0;
        if (timeSec > 100000) {
            timeSec = Math.floor(timeSec / 1000);
        }

        return {
            university: teamInfo.univ,
            team: teamInfo.teamName,
            task: task,
            verdict: verdict,
            time: timeSec
        };
    });

    return {
        name: contestName,
        tasks: tasks,
        balloons: getTaskColours(tasks, balloons),
        duration: duration,
        freeze: freeze,
        submissions: submissions
    };
}

// Universal Cup external results contain per-problem totals, not a run log.
function parseUniversalCupContestId(input) {
    const match = String(input).trim().match(/^(?:https?:\/\/contest\.ucup\.ac\/(?:contest\/|results\/QOJ)|QOJ)?([1-9]\d*)(?:\/(?:standings|submissions))?\/?(?:\?[^#]*)?(?:#.*)?$/i);
    if (!match) throw new Error('Enter a Universal Cup contest ID or contest.ucup.ac contest/results URL.');
    return match[1];
}

function parseUniversalCupResults(html) {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const table = document.querySelector('table.standings');
    if (!table) throw new Error('No Universal Cup results table found. Check that the contest has published results.');
    // BR does not contribute whitespace to textContent.
    function text(cell) {
        const copy = cell.cloneNode(true);
        copy.querySelectorAll('br').forEach(br => br.replaceWith(' '));
        return copy.textContent.replace(/\s+/g, ' ').trim();
    }
    const header = Array.from(table.querySelector('tr').querySelectorAll('th'));
    const solvedColumn = header.findIndex(cell => /^Solved$/i.test(text(cell)));
    if (solvedColumn < 3) throw new Error('Unsupported Universal Cup results table.');
    const tasks = header.slice(2, solvedColumn).map(cell => text(cell).split(' ')[0]);
    if (tasks.some(task => !/^[A-Z]+$/.test(task)) || new Set(tasks).size !== tasks.length) {
        throw new Error('Could not read Universal Cup problem labels.');
    }
    const submissions = [], teams = [];
    for (const row of table.querySelectorAll('tr')) {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length < solvedColumn + 2 || !/^\d+$/.test(text(cells[0]))) continue;
        const university = cleanTeamName(text(cells[1]));
        teams.push({ university, team: '' });
        for (let index = 0; index < tasks.length; index++) {
            const value = text(cells[index + 2]);
            if (!value || value === '-') continue;
            // Ignore optional result markers. +N counts failures before AC;
            // -N counts all failures. The displayed timestamp is in h:mm.
            const match = value.match(/^\*?([+-])(\d*)\s+(\d+):([0-5]\d)(?::([0-5]\d))?$/);
            if (!match || (match[1] === '-' && !match[2])) {
                throw new Error('Unsupported Universal Cup cell (pending or partial scores): ' + value);
            }
            const failures = Number(match[2] || 0);
            const time = Number(match[3]) * 3600 + Number(match[4]) * 60 + Number(match[5] || 0);
            if (time >= 18000 || failures > 1000) throw new Error('Unsupported Universal Cup time or attempt count.');
            const run = { university, team: '', task: tasks[index], time,
                firstSolve: cells[index + 2].classList.contains('opener') };
            // All failures appear at the cell's displayed time. This preserves
            // final penalties without inventing earlier submission timestamps.
            for (let attempt = 0; attempt < failures; attempt++) {
                submissions.push({ ...run, verdict: 'rejected' });
            }
            if (match[1] === '+') submissions.push({ ...run, verdict: 'accepted' });
        }
    }
    if (!teams.length) throw new Error('No teams found in the Universal Cup results.');
    return {
        name: document.querySelector('h2')?.textContent.trim() || 'Universal Cup',
        tasks, teams, duration: 18000, freeze: 3600,
        balloons: getTaskColours(tasks),
        // Results round times to minutes; use the opener marker to resolve
        // first-solve ties, and count failures before an AC in the same minute.
        submissions: submissions.sort((a, b) => a.time - b.time ||
            Number(a.verdict === 'accepted') - Number(b.verdict === 'accepted') ||
            Number(b.firstSolve) - Number(a.firstSolve))
    };
}

async function fetchUniversalCupData(input) {
    const contestId = parseUniversalCupContestId(input);
    const url = `https://contest.ucup.ac/results/QOJ${contestId}`;
    const response = await fetch('https://corsproxy.io/?key=eb06d979&url=' + encodeURIComponent(url));
    if (!response.ok) throw new Error(`Could not fetch Universal Cup results (${response.status}).`);
    return parseUniversalCupResults(await response.text());
}

// QOJ publishes external results in the same standings format as UCUP.
function parseQOJContestId(input) {
    const match = String(input).trim().match(/^([1-9]\d*)$/);
    if (!match) throw new Error('Enter a numeric QOJ contest ID, e.g. 4565.');
    return match[1];
}

async function fetchQOJData(input) {
    const contestId = parseQOJContestId(input);
    const url = `https://qoj.ac/results/QOJ${contestId}`;
    const response = await fetch('https://corsproxy.io/?key=eb06d979&url=' + encodeURIComponent(url));
    if (!response.ok) throw new Error(`Could not fetch QOJ results (${response.status}).`);
    try {
        const contest = parseUniversalCupResults(await response.text());
        if (contest.name === 'Universal Cup') contest.name = `QOJ${contestId}`;
        return contest;
    } catch (error) {
        throw new Error(error.message.replaceAll('Universal Cup', 'QOJ'));
    }
}

async function fetchCFData(input, apiKey = '', apiSecret = '') {
    const contestId = String(input).trim();
    if (!/^[1-9]\d*$/.test(contestId)) throw new Error('Enter a numeric CF Gym contest ID.');
    apiKey = apiKey.trim();
    apiSecret = apiSecret.trim();
    if (!apiKey || !apiSecret) throw new Error('Enter your CF API key and secret to access Gym standings.');
    let lastRequest = 0;
    async function request(method, extra = {}) {
        // CF allows one API request per two seconds.
        const wait = 2100 - (Date.now() - lastRequest);
        if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
        const params = new URLSearchParams({ apiKey, contestId, ...extra, time: String(Math.floor(Date.now() / 1000)) });
        params.sort();
        const random = Array.from(crypto.getRandomValues(new Uint8Array(3)), byte => byte.toString(16).padStart(2, '0')).join('');
        const signatureInput = `${random}/${method}?${Array.from(params, ([key, value]) => `${key}=${value}`).join('&')}#${apiSecret}`;
        const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(signatureInput));
        params.set('apiSig', random + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join(''));
        // Send credentials only to CF; never through a proxy.
        lastRequest = Date.now();
        const response = await fetch(`https://codeforces.com/api/${method}?` + params);
        const raw = await response.text();
        console.log(`[CF API ${method}] HTTP ${response.status}`, raw);
        const status = `CF API ${method} HTTP ${response.status}${response.statusText ? ' ' + response.statusText : ''}`;
        if (!response.ok) throw new Error(`${status}: ${raw}`);
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            throw new Error(`${status}: ${raw}`);
        }
        if (data.status !== 'OK') throw new Error(`${status}: ${raw}`);
        return data.result;
    }
    const standings = await request('contest.standings');
    // Always use the submission log for replay events, even when standings
    // rows are available. Standings supply metadata and zero-submission teams.
    const runs = [];
    const pageSize = 10000;
    for (let from = 1; ; from += pageSize) {
        const page = await request('contest.status', { from: String(from), count: String(pageSize) });
        runs.push(...page);
        if (page.length < pageSize) break;
    }
    return parseCFSubmissions(standings, runs);
}

function parseCFSubmissions({ contest, problems, rows = [] }, runs) {
    if (contest.type !== 'ICPC') throw new Error('CF requires a Gym contest with ICPC scoring.');
    const tasks = problems.map(problem => problem.index);
    const teams = new Map(), submissions = [], seen = new Set();
    function identify(party) {
        const handles = (party.members || []).map(member => member.handle).sort().join(', ');
        const key = party.teamId != null ? `team:${party.teamId}` : (handles || party.teamName);
        if (!teams.has(key)) teams.set(key, { university: cleanTeamName(party.teamName || handles), team: '' });
        return teams.get(key);
    }
    for (const { party } of rows) {
        if (!['PRACTICE', 'MANAGER'].includes(party.participantType)) identify(party);
    }
    const filtered = { duplicate: 0, participantType: 0, time: 0, problem: 0, verdict: 0 };
    const participantTypes = {};
    const ignored = new Set(['COMPILATION_ERROR', 'TESTING', 'SUBMITTED', 'SKIPPED']);
    for (const run of [...runs].sort((a, b) => a.relativeTimeSeconds - b.relativeTimeSeconds || a.id - b.id)) {
        if (seen.has(run.id)) { filtered.duplicate++; continue; }
        seen.add(run.id);
        const party = run.author;
        participantTypes[party.participantType] = (participantTypes[party.participantType] || 0) + 1;
        if (['PRACTICE', 'MANAGER'].includes(party.participantType)) { filtered.participantType++; continue; }
        const time = run.relativeTimeSeconds;
        if (!Number.isFinite(time) || time < 0 || time >= contest.durationSeconds) { filtered.time++; continue; }
        if (!tasks.includes(run.problem.index)) { filtered.problem++; continue; }
        const team = identify(party);
        if (!run.verdict || ignored.has(run.verdict)) { filtered.verdict++; continue; }
        submissions.push({ ...team, task: run.problem.index, time,
            verdict: run.verdict === 'OK' ? 'accepted' : 'rejected' });
    }
    const debug = { returned: runs.length, standingsRows: rows.length, teams: teams.size,
        submissions: submissions.length, participantTypes, filtered };
    console.log('[CF conversion]', debug);
    if (!teams.size) throw new Error(`CF API returned ${runs.length} submissions, but none could be used for replay. Participant types: ${JSON.stringify(participantTypes)}. Filtered: ${JSON.stringify(filtered)}.`);
    return {
        name: contest.name, tasks, teams: [...teams.values()],
        duration: contest.durationSeconds, freeze: contest.freezeDurationSeconds ?? 3600,
        balloons: getTaskColours(tasks), submissions
    };
}
