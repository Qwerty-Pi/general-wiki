<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DSE Mathematics Compulsory Part Practice Paper</title>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js"></script>
    <script src="https://code.jquery.com/jquery-4.0.0.js" integrity="sha256-9fsHeVnKBvqh3FB2HYu7g2xseAZ5MlN6Kz/qnkASV8U=" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="index.css">
    <link rel="stylesheet" href="style.css">
</head>

<style>
    .answer-container {
        display: grid;
        grid-template-columns: 5em repeat(5, 1em) 0.5em repeat(5, 1em) 2em repeat(5, 1em) 0.5em repeat(5, 1em) 2em repeat(5, 1em) 0.5em repeat(5, 1em) 2em repeat(5, 1em) 0.5em repeat(5, 1em) 2em repeat(5, 1em) 0.5em repeat(5, 1em) 2em repeat(4, 1em);
        align-items: center;
        text-align: center;
    }
</style>
<body>
    <link rel="stylesheet" href="functions.js">
	<div class="answer-container">
        <?php
            $years = array_merge(range(1977, 2011), ["2012-SP", "2012-PP"], range(2012, 2025));
            foreach ($years as $year) {
                echo "<div>$year</div>";
                $answers = json_decode(file_get_contents("artifact/paper-2/$year/answers.json"), true);
                while (count($answers) < 54) {
                    array_push($answers, "");
                }
                $i = 0;
                foreach ($answers as $answer) {
                    echo "<div>$answer</div>";
                    $i += 1;
                    if ($i % 5 == 0) {
                        echo "<div></div>";
                    }
                }
            }
        ?>
	</div>
</body>
</html>


