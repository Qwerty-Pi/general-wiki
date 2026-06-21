
async function appendQuestion(container, label, identifier, data) {
    questionOrder = $("<div class='question-order'>").html(label)
    questionLabel = $("<div class='question-label'>").append(questionOrder)
    
    if (identifier) {
        questionReference = $("<div class='question-reference'>")
            .append($("<span>").html(identifier[0]))
            .append($("<span>").html('Q' + identifier[1]))
        questionLabel.append(questionReference)
    }
    
    statement = $("<div class='question-statement'>")
                    .html(data.statement)
    options = $("<div class='option-container'>")
    const labels = "ABCDE"
    option_id = 0
    for (const option of data.options) {
        options
        .append($("<div class='option'>")
        .append(`<span class='option-label'>${labels[option_id]}. </span>`)
        .append(option))
        option_id += 1
    }

    content = $("<div class='question-content'>")
    if (identifier) {
        content.data('identifier', identifier[0] + ' ' + identifier[1])
    }
    container.append(questionLabel)
    content.append(statement)
    content.append(options)

    container.append(content);
}


async function fetchJson(paper, year, file) {
    try {
        res = await fetch(`artifact/paper-${paper}/${year}/${file}.json`)
        return await res.json()
    } catch {
        return []
    }
}


questions = []
topics = []

async function loadQuestionJson(paper, year) {
    questions[year] = await fetchJson('2', year, 'questions')
}

async function loadTopicJson(paper, year) {
    topics[year] = await fetchJson('2', year, 'topics')
}

var years = []
for (year = 1980; year <= 2011; year++) {
    years.push(year)
}
years.push("2012-PP")
years.push("2012-SP")
for (year = 2012; year <= 2025; year++) {
    years.push(year)
}
