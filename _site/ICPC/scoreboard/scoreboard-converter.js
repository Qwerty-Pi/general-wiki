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
                teams[tId] = { univ, teamName };
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
        
        teamMap[tId] = { univ, teamName };
    });

    // 4. Extract Config Metadata
    let contestName = configData.contest_name || configData.title || configData.name || "Contest";
    if (typeof contestName === 'object') {
        contestName = contestName.texts[contestName.fallback_lang];
    }
    let tasks = [];
    tasks = configData.problems.map(p => typeof p === 'string' ? p : (p.label || p.id || p.name));

    let balloons = {};
    configData.problems.forEach(function (data) {
        balloons[data.label] = data.balloon_color;
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
        balloons: balloons,
        duration: duration,
        freeze: freeze,
        submissions: submissions
    };
}