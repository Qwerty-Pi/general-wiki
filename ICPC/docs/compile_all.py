import os

for file in os.listdir():
    if file == "layout.php":
        continue
    os.system(f"php layout.php file={file.split(".")[0]}")
