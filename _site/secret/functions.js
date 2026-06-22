
async function appendQuestion(container, label, identifier, data, answer = null) {
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
    for (const option_content of data.options) {
        label = labels[option_id]
        option = ($("<div class='option'>")
        .append(`<span class='option-label'>${label}. </span>`)
        .append(option_content))
        if (label == answer) {
            option.addClass("answer-hidden")
        }
        if (option_content.includes("img")) {
            option.addClass("option-image")
        }
        options.append(option)
        option_id += 1
    }

    content = $("<div class='question-content'>")
    if (identifier) {
        content.data('identifier', identifier[0] + ' Q' + identifier[1])
    }
    content.append(statement)
    content.append(options)
    
    container.append(questionLabel)
    container.append(content)
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
answers = []

async function loadQuestionJson(paper, year) {
    questions[year] = await fetchJson('2', year, 'questions')
}

async function loadTopicJson(paper, year) {
    topics[year] = await fetchJson('2', year, 'topics')
}

async function loadAnswerJson(paper, year) {
    answers[year] = await fetchJson('2', year, 'answers')
}

var years = []
for (year = 1980; year <= 2011; year++) {
    years.push(year)
}
years.push("2012-SP")
years.push("2012-PP")
for (year = 2012; year <= 2025; year++) {
    years.push(year)
}

function toggleAnswer(label) {
    const content = label.next()
    if (label.hasClass("answer-shown")) {
        label.removeClass("answer-shown")
        content.find(".answer").removeClass("answer").addClass("answer-hidden")
    } else {
        label.addClass("answer-shown")
        content.find(".answer-hidden").removeClass("answer-hidden").addClass("answer")
    }
}