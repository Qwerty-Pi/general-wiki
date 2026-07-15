import os, requests
import os.path

task_site = "https://projecteuler.net/minimal={}"

os.makedirs("sauce", exist_ok=True)

# returns true on success
def request_and_write(task_id):
    sauce = f"sauce/{task_id}.html"
    if os.path.isfile(sauce):
        return True
    r = requests.get(task_site.format(task_id), timeout=5)
    if r.status_code == 200:
        open(sauce, "w").write(r.text)
        return True
    else:
        print("Error: Rate limited by PE?")
        return False

for _ in range(1, 1020):
    while not request_and_write(_):
        pass
    print(f"Downloaded Question {_}")
