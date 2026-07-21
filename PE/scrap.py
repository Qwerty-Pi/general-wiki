import os, requests
import os.path
import json

task_site = "https://projecteuler.net/minimal={}"

os.makedirs("sauce", exist_ok=True)

# returns true on success
def request_and_write(task_id):
    sauce = f"sauce/{task_id}.html"
    if os.path.isfile(sauce) and open(sauce).read().strip() != "Data for that problem cannot be found":
        return True
    r = requests.get(task_site.format(task_id), timeout=5)
    if r.status_code == 200:
        open(sauce, "w").write(r.text)
        return True
    else:
        print("Error: Rate limited by PE?")
        return False

def process_questions_metadata():
    metadata = dict()
    with open("problems.csv", "r") as f:
        content = f.read()
        for row in content.split("\n"):
            words = [_.strip() for _ in row.split("##")]
            if len(words) != 7 or words == "ID": continue
            print(words)
            metadata[words[0]] = {
                "name": words[1],
                "release": words[2],
                "solves": words[3],
                "rank": words[4],
                "level": words[5],
                "rating": words[6]
            }
        with open("metadata.json", "w") as f:
            f.write(json.dumps(metadata))

def download_questions_metadata():
    url = "https://projecteuler.net/minimal=problems"
    r = requests.get(url)
    metadata = dict()
    if r.status_code == 200:
        content = r.text
        print(content)
        return True
    else:
        print(f"Status Code: {r.status_code}\n{r.text}")
        return False

def download_questions_content():
    for _ in range(1, 1020):
        while not request_and_write(_):
            pass
        print(f"Downloaded Question {_}")

process_questions_metadata()
