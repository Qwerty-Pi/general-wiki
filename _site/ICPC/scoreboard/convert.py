import json
import re

def parse_icpc_dat(dat_content: str) -> dict:
    contest_name = "Contest"
    tasks = []
    duration = 18000  # Default 5 hours in seconds
    freeze = 3600     # Default 1 hour in seconds
    teams = {}        # Maps team_id -> (university, team_name)
    submissions = []

    for line in dat_content.splitlines():
        line = line.strip()
        if not line:
            continue

        # 1. Parse Contest Title
        if line.startswith("@contest"):
            match = re.search(r'@contest\s+"([^"]+)"|@contest\s+(.+)', line)
            if match:
                contest_name = match.group(1) or match.group(2)

        # 2. Parse Duration (convert minutes to seconds if needed)
        elif line.startswith("@contlen"):
            parts = line.split()
            if len(parts) > 1:
                val = int(parts[1])
                duration = val * 60 if val < 1000 else val

        # 3. Parse Freeze Duration
        elif line.startswith("@freeze"):
            parts = line.split()
            if len(parts) > 1:
                val = int(parts[1])
                freeze = val * 60 if val < 1000 else val

        # 4. Parse Task/Problem Letters
        elif line.startswith("@p "):
            # Format: @p A,A,20,0
            payload = line[3:].strip()
            task_letter = payload.split(",")[0].strip()
            if task_letter and task_letter not in tasks:
                tasks.append(task_letter)

        # 5. Parse Teams (Format: @t id,0,1,"University - TeamName - ")
        elif line.startswith("@t "):
            match = re.match(r'@t\s+(\d+),[^"]*"([^"]+)"', line)
            if match:
                t_id = match.group(1)
                full_str = match.group(2).strip()
                # Split by hyphen to isolate university and team name
                parts = [p.strip() for p in full_str.split("-") if p.strip()]

                if len(parts) >= 2:
                    univ, team_name = parts[0], parts[1]
                elif len(parts) == 1:
                    univ, team_name = parts[0], parts[0]
                else:
                    univ, team_name = t_id, t_id

                teams[t_id] = (univ, team_name)

        # 6. Parse Submissions (Format: @s team_id,task,attempt,time_sec,status)
        elif line.startswith("@s ") or line.startswith("@run"):
            payload = line.split(maxsplit=1)[1]
            parts = [p.strip() for p in payload.split(",")]
            
            if len(parts) >= 5:
                t_id = parts[0]
                task = parts[1]
                time_sec = int(parts[3])
                status = parts[4].upper()

                # Get university and team name or fallback to IDs
                univ, team_name = teams.get(t_id, (t_id, t_id))
                verdict = "accepted" if status in ("OK", "AC", "1") else "rejected"

                submissions.append({
                    "university": univ,
                    "team": team_name,
                    "task": task,
                    "verdict": verdict,
                    "time": time_sec
                })

    return {
        "name": contest_name,
        "tasks": tasks,
        "duration": duration,
        "freeze": freeze,
        "submissions": submissions
    }


def dat_to_json_file(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    result = parse_icpc_dat(content)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=4)


if __name__ == "__main__":
    dat_to_json_file("contest.dat", "chengdu-2026.json")
