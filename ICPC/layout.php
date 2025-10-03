<!DOCTYPE HTML>
<html>
<head>
	<script type="text/x-mathjax-config">
		MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}});
	</script>
	<script type="text/javascript"
		src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML">
	</script>
    <link rel="stylesheet" type="text/css" href="../index.css">
	<link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Ubuntu:regular,bold&subset=Latin">

	<script src="https://code.jquery.com/jquery-3.7.1.js" integrity="sha256-eKhayi8LEQwp4NKxN+CfCh+3qOVUtJn3QNZ0TciWLP4=" crossorigin="anonymous"></script>
</head>
<body>
	<?php echo file_get_contents($_SERVER['DOCUMENT_ROOT'] . '/ICPC/' . $_GET['file'] . '.html'); ?>
</body>

<script>
	function loadFile(code) {
		$.ajax ({
			method: "GET",
			url: window.location.origin + '/' + code.data("include"),
			success: function(content) {
				content = content
					.replaceAll("<", "&lt;")
					.replaceAll(">", "&gt;")
				code.html(content)
			}
		})
	};

	$(function () {
		var includes = $('[data-include]')
		$.each(includes, function () {
			loadFile($(this))
		})
	})
</script>

</html>
