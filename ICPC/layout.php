<!DOCTYPE HTML>
<html>
<head>
	<script type="text/x-mathjax-config">
		MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}});
	</script>
	<script type="text/javascript"
		src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML">
	</script>
    <link rel="stylesheet" type="text/css" href="../index.css">
	<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Ubuntu:regular,bold&subset=Latin">
	<script src="https://code.jquery.com/jquery-3.7.1.js" integrity="sha256-eKhayi8LEQwp4NKxN+CfCh+3qOVUtJn3QNZ0TciWLP4=" crossorigin="anonymous"></script>
	<script src="../function.js"></script>
</head>
<body>
	<?php echo file_get_contents($_SERVER['DOCUMENT_ROOT'] . '/ICPC/' . $_GET['file'] . '.html'); ?>
</body>
</html>
