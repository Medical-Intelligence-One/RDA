// import * as CodeMirror from "codemirror"
// import { } from "@codemirror/commands"
import { basicSetup, EditorState, EditorView } from '@codemirror/basic-setup';
import { keymap } from "@codemirror/view"
import { indentWithTab } from "@codemirror/commands"
import { autocompletion, CompletionContext, startCompletion } from "@codemirror/autocomplete"
import { StateField, EditorSelection } from "@codemirror/state"
import { Tooltip, showTooltip } from "@codemirror/tooltip"
import { indentUnit } from '@codemirror/language'
import rareDiseaseData from '../mi1-rare-disease/rare-diseases.json'       //test data until api is working
import autocompleteRareDiseaseData from '../mi1-rare-disease/autocomplete_rareDz_findings.json'       //test data until api is working
const axios = require('axios')
const headers = {
    'Access-Control-Allow-Origin': '*'
}
var view
var searchOptions = []
var diseaseFindings = []
// var curFindings = []
var myCodeMirror
// var arrCUIs = []
// var codemirror = $('#editor').nextAll('.CodeMirror')[0]

var divSelectedTerms = $('#selected-terms')
// var divAssociatedFindings = $('#associated-findings')

let myTheme = EditorView.theme({
    "cm-editor": {
        fontSize: "18px",
        width: "100%",
        // minHeight: "600px",
        outline: 0,
        border: 0,
        fontFamily: 'Rubik Light, Open Sans'
    },
    ".cm-content": {
        fontSize: "18px"
    },
    ".cm-activeLine": {
        backgroundColor: "initial"
    },
    ".cm-gutters": {
        display: "none"
    },
    ".cm-scroller": {
        // minHeight: "600px",
        fontFamily: 'Rubik Light, Open Sans'
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
        lineHeight: 1.8,
        fontFamily: "Rubik Light, Open Sans",
        textAlign: "left"

    },
    ".cm-tooltip": {
        fontSize: "14px",
        fontFamily: 'Rubik Light, Open Sans'
    },
    ".cm-lineWrapping": {
        // wordBreak: "break-all",
    }
}, { dark: false })

//add popover
function addPosNegPopover($myTag) {

    var $content
    var myPopover = $myTag.children('.selection-tag-text')
    $content = $('#posneg-popover-template').clone().removeAttr('id')

    $(myPopover).popover("dispose")
    $(myPopover).popover({
        title: "title",
        content: $content.html(),
        trigger: "manual",
        placement: "left"
    }).on("mouseenter", function () {
        var _this = this;
        $(this).popover("show")
        $(".popover").on("mouseleave", function () {
            $(_this).popover('hide')
        });
    }).on("mouseleave", function () {
        var _this = this;
        setTimeout(function () {
            if (!$(".popover:hover").length) {
                $(_this).popover("hide")
            }
        }, 50)
    })
}

//refresh autocomplete list for findings using startsWith phrase
async function fetchAutoCompleteFromAPI(startsWith) {

    let autoCompleteData = []

    if (startsWith.length >= 3) {
        const body = {
            "startsWith":
                [
                    {
                        "startsWith": startsWith
                    }
                ]
        }

        // autoCompleteData = autocompleteRareDiseaseData
        await axios.post('https://api.mi1.ai/api/autocomplete_rareDz_findings', body, { headers })
            .then(function (response) {
                let autoCompleteData = response.data
                searchOptions = []

                // if (autoCompleteData.length > 0) {
                //     searchOptions = []
                //     searchOptions = searchOptions.concat(curFindings)
                // }
                // searchOptions = curFindings.slice()
                //add autoComplete API response to autocomplete list. On selection, add tag to selected-terms div and refresh disease data 
                for (var i = 0; i <= autoCompleteData.length - 1; i++) {

                    let cui = autoCompleteData[i].Clinical_Finding_CUI
                    let name = autoCompleteData[i].Clinical_Finding
                    let frequency = null
                    let addClasses = "removeable selected " + $('#search-section').hasClass('positive-search') ? 'positive-finding' : 'negative-finding'
                    searchOptions.push({
                        info: cui,
                        label: name,
                        apply: () => {
                            view.dispatch({
                                changes: {
                                    from: 0,
                                    to: view.state.doc.length,
                                    insert: ''
                                }
                            })
                            createTag(divSelectedTerms, name, cui, frequency, addClasses, fetchDiseases)

                        }
                    })

                }

            }).catch(function (error) { console.log(error) }).then(function () { })
    }
}

//populates autocomplete searchoptions using disease findings
function fetchAutoCompleteFromDiseaseFindings(contains) {
    searchOptions = []
    let $divFindings = $('#suggestions-container .selection-tag')
    let allFindings = []
    $divFindings.each(function (i, obj) {
        let cui = $(obj).find('.selection-tag-cui').text()
        let label = $(obj).find('.selection-tag-text').text()
        let frequency = $(obj).find('.selection-tag-frequency').text()

        if (!searchOptions.some(e => { if (e.info == cui && e.label == label) { return true } }) && label.toLowerCase().indexOf(contains.toLowerCase()) >= 0) {
            searchOptions.push({
                info: cui,
                label: label,
                apply: () => {
                    view.dispatch({
                        changes: {
                            from: 0,
                            to: view.state.doc.length,
                            insert: ''
                        }
                    })
                    createTag(divSelectedTerms, label, cui, frequency, "removeable selected", fetchDiseases)
                }
            })
        }
    })
}

function myCompletions(context: CompletionContext) {

    let word = view.state.doc.toString();       //get content of editor

    //cancel autocomplete if <3 characters entered and there are no tags in the selected terms div
    if (word.length < 3) {
        if ($('#suggestions-container .selection-tag').length > 0) {
            fetchAutoCompleteFromDiseaseFindings(word)
        }
        else {
            searchOptions = []
            return null
        }
    }
    else {
        fetchAutoCompleteFromAPI(word)
    }


    return {
        from: 0,
        options: searchOptions
    }
}

let state = EditorState.create({
    doc: "Press Ctrl-Space in here...\n",
    extensions: [basicSetup, autocompletion({ override: [myCompletions], defaultKeymap: true }),
    ]
})


//returns Diseases based on selected CUIS
async function fetchDiseases() {

    //write selected CUI tag elements into array
    let cuiArrayPromise = new Promise(function (resolve) {
        sortSearchTerms()
        var matchedFindings = []
        var negativeMatchedFindings = []
        //iterate through all the tags in the selected-terms div to get the cuis
        let $selectedTags = $('#selected-terms .selection-tag.selected:not(.d-none)')
        if ($selectedTags.length > 0) {
            $selectedTags.each(function (i, obj) {
                if ($(obj).hasClass('positive-finding')) {
                    matchedFindings.push({
                        CUI: $(obj).find('.selection-tag-cui').text()
                    })
                }
                else {
                    negativeMatchedFindings.push({
                        CUI: $(obj).find('.selection-tag-cui').text()
                    })
                }
            })
        }
        resolve(
            {
                CUIs: matchedFindings
                // Matched_Findings: matchedFindings,
                // Negative_Matched_Findings: negativeMatchedFindings
            }
        )
    })

    await axios.post('https://api.mi1.ai/api/rareDiseaseSearch', await (cuiArrayPromise), { headers })
        // await axios.post('https://api.mi1.ai/api/PotentialComorbidities', await (cuiArrayPromise), { headers })
        .then(async function (response) {
            $('#associated-findings').empty()
            $('#suggestions-container').empty()

            if (response.data.length > 0) {
                showDiseases(response.data)
            }
            else {
                clearScreen()
            }
        }).catch(function (error) {
            console.log('api error: ' + error)
            clearScreen()
        });

    // showDiseases(rareDiseaseData)
    view.focus
    try {
        startCompletion
    }
    catch (ex) {
        console.log(console.log(ex))
    }
}

//create a findings tag with click event. This has a call back function to ensure api call is done only on completion of tag creation
function createTag(parentElement, label, id, frequency, addClasses, callback) {
    // var htmlString = "<span class='finding-tag' id='" + info + "'>" + label + "</span><span class='close'></span>"
    var $divTag = $('#selection-tag-template').clone().removeAttr('id').removeClass('d-none')

    $divTag.children('.selection-tag-text').text(label)
    $divTag.children('.selection-tag-cui').text(id)
    $divTag.children('.selection-tag-frequency').text(frequency)

    //set frequency shading and title
    let objFrequency = getFrequencyScale(frequency)
    $divTag.children('.selection-tag-frequency').css('background-color', 'rgba(0,0,0,' + (objFrequency.value) / 5 + ')')
    // $divTag.children('.selection-tag-frequency').attr('title', objFrequency.description + ": " + objFrequency.range)
    $divTag.children('.selection-tag-frequency-gradient').attr('title', objFrequency.description + ": " + objFrequency.range)
    $divTag.children('.empty-box').attr('title', objFrequency.description + ": " + objFrequency.range)
    // $divTag.children('.selection-tag-frequency-gradient').css('background-image', 'conic-gradient(white ' + objFrequency.range_floor + '%, #F32E15 ' + (objFrequency.range_floor) + '% ' + objFrequency.range_ceiling + '%, white ' + objFrequency.range_ceiling + '%')
    // $divTag.children('.selection-tag-frequency-gradient').css
    //     ('background-image', 'linear-gradient(to right, white, black ' + (objFrequency.range_floor) + '%, white ' + objFrequency.range_ceiling + '%)')
    $divTag.children('.empty-box').css('width', (1 - frequency) * 50 + 'px')
    $divTag.children('.empty-box').css('margin-left', (1 - frequency) * -50 + 'px')

    //add any additional classes
    $divTag.addClass(addClasses)


    var myPopoverTrigger = $divTag.children('.selection-tag-text')
    //add click event to add tag to selected-terms div and requery the database
    if ($divTag.hasClass('selectable')) {
        addPosNegPopover($divTag)
        myPopoverTrigger.on('shown.bs.popover', function () {
            $('.btn.positive-finding').on("click", function (e) { addTagToSearch($divTag, 'positive-finding', 'negative-finding') })
            $('.btn.negative-finding').on("click", function (e) { addTagToSearch($divTag, 'negative-finding', 'positive-finding') })
        });
        // $divTag.children('.selection-tag-text').on("click", function () {
        //     $divTag.removeClass('selectable top-eight')
        //     $divTag.addClass('removeable selected sticky-top')

        //     $divTag.children('.selection-tag-text').off("click");       //unbind click event before appending to selected terms div

        //     divSelectedTerms.append($divTag)
        //     updateTagTitle($divTag)
        //     fetchDiseases()
        // })
    }
    else {
        myPopoverTrigger.popover("dispose")
    }

    //add click event to'x' symbol to remove tag from selected-terms div and requery the database
    $divTag.find(".remove-tag").on("click", function () {
        $divTag.remove()
        fetchDiseases()
    })
    // }

    updateTagTitle($divTag)
    parentElement.append($divTag)

    if (callback) {
        callback()
    }
}

//adds a tag to the search criteria as either a positive or negative finding
function addTagToSearch($myTag, classToAdd, classToRemove) {

    $myTag.removeClass('selectable top-eight ' + classToRemove)
    $myTag.addClass('removeable selected sticky-top ' + classToAdd)

    $myTag.children('.selection-tag-text').off("click");       //unbind click event before appending to selected terms div
    $myTag.children('.selection-tag-text').popover("dispose");       //unbind click event before appending to selected terms div

    divSelectedTerms.append($myTag)
    updateTagTitle($myTag)
    //hide popover
    $myTag.children('.selection-tag-text').popover('hide');
    //update diseases
    fetchDiseases()

}
//adds a mouseover caption to a tag
function updateTagTitle($divTag) {
    let textTitle = ''
    let posNegTitle = ''
    if ($divTag.hasClass('selectable')) {
        if (!$divTag.hasClass('selected')) {
            textTitle = 'Finding excluded from Search. Click to Add.'
        }
        else {
            textTitle = ''
        }
    }
    if ($divTag.hasClass('positive-finding')) {
        posNegTitle = 'Positive Finding. Click to change to Negative.'
    }
    else {
        posNegTitle = 'Negative Finding. Click to change to Positive.'
    }
    $divTag.children('.selection-tag-text').attr('title', textTitle)
}

//sort search terms alphabetically
function sortSearchTerms() {
    var mylist = $('#selected-terms');
    var posFindings = mylist.children('.selection-tag.positive-finding').get();
    var negFindings = mylist.children('.selection-tag.negative-finding').get();

    posFindings.sort(function (a, b) {
        return $(a).children('.selection-tag-text').text().toUpperCase().localeCompare($(b).children('.selection-tag-text').text().toUpperCase());
    })
    $.each(posFindings, function (i, obj) {
        mylist.append(obj);
    });

    negFindings.sort(function (a, b) {
        return $(a).children('.selection-tag-text').text().toUpperCase().localeCompare($(b).children('.selection-tag-text').text().toUpperCase());
    })
    $.each(negFindings, function (i, obj) {
        mylist.append(obj);
    });
}

//display output from api call showing returned diseases with associated evidence displayed as tags
function showDiseases(data) {

    // sort data by probability 
    // data.sort(function (a, b) {
    //     return (parseFloat(a.Disease_Probability) - parseFloat(b.Disease_Probability))
    // })
    diseaseFindings = []
    searchOptions = []
    $('.container-fluid').removeClass('is-empty')
    // curFindings = []
    // populate suggestion-template with disease data and add to suggestions-container div
    try {
        for (let arrIndex = 0; arrIndex < data.length; arrIndex++) {
            let diseaseItem = data[arrIndex]
            let $divSuggestion = $('#suggestion-template').clone().removeAttr('id').removeClass('d-none')
            // let $divSuggestion = $('#suggestion-template').clone().attr('id', diseaseItem.Disease_CUI).removeClass('d-none')

            $divSuggestion.find('.disease-name').text(diseaseItem.Disease)

            $divSuggestion.find('.disease-info').text(diseaseItem.Disease_Definition)

            // let probability = Math.round(Math.abs(obj.Disease_Probability)) + '%'
            let probability = Math.round(diseaseItem.Disease_Probability)
            $divSuggestion.find('.disease-probability').text(probability)

            let prevalence = diseaseItem.Disease_Prevalence
            let floatPrevalence = parseFloat(prevalence)
            if (!isNaN(floatPrevalence)) {
                $divSuggestion.find('.disease-prevalence').text(floatPrevalence.toExponential())
                let objPrevalence = getPrevalenceScale(floatPrevalence)
                // $divSuggestion.find('.disease-prevalence').css('background-color', 'rgba(0,0,0,' + (objPrevalence.value) / 5 + ')')
                // $divSuggestion.find('.disease-prevalence').attr('title', objPrevalence.description)
            }
            //publications
            let evidence = diseaseItem.Disease_Finding_Assoc_Evidence
            let publicationsHtmlString = '';
            if (evidence != null) {
                for (let j = 0; j < evidence.length; j++) {
                    let url = evidence[j]
                    publicationsHtmlString += '<a class="publication-url" href=' + url + ' target="_blank">' + (j + 1)
                }
                publicationsHtmlString = "Publications:" + publicationsHtmlString
            }

            //connected papers
            $divSuggestion.find('.connected-papers').attr('title', 'Search Connected Papers for ' + diseaseItem.Disease)
            $divSuggestion.find('.connected-papers').on("click", function (el) {
                let url = "https://www.connectedpapers.com/search?q=" + diseaseItem.Disease
                window.open(url, '_blank').focus();
            })
            // $divSuggestion.find('.associated-evidence').attr('data-bs-original-title', publicationsHtmlString)
            if (publicationsHtmlString == '') {
                $divSuggestion.find('.disease-evidence').hide()
            }
            else {
                $divSuggestion.find('.disease-evidence').append(publicationsHtmlString)
            }

            $divSuggestion.find('.suggestion-header').on("click", function (e) {
                $divSuggestion.toggleClass('contracted');
            })

            // * * populate findings div for diagnosis and associated findings div for top 3 diagnoses
            //create isMatched property and concatenate matched and unmatched findings
            diseaseItem.Matched_Findings.forEach(function (element) {
                element.IsMatched = "true";
                element.Rank = 2 + element.Frequency
                element.TypeOfFinding = "Matched"
            });
            diseaseItem.Unmatched_Findings.forEach(function (element) {
                element.IsMatched = "false";
                element.Rank = element.Frequency
                element.TypeOfFinding = "Unmatched"
            });
            // diseaseItem.Negative_matched_findings.forEach(function (element) {
            //     element.IsMatched = "false";
            //     element.Rank = 1 + element.Frequency
            //     element.TypeOfFinding = "NegativeMatched"
            // });
            diseaseFindings = diseaseItem.Matched_Findings.concat(diseaseItem.Unmatched_Findings)
            // diseaseFindings = diseaseItem.Matched_Findings.concat(diseaseItem.Unmatched_Findings).concat(diseaseItem.Negative_matched_findings)

            // sort data by frequency
            diseaseFindings.sort(function (a, b) {
                return (parseFloat(b.Rank) - parseFloat(a.Rank))
            })

            //eliminate duplicates

            //iterate through findings
            if (diseaseFindings != null) {
                for (let j = 0; j < diseaseFindings.length; j++) {
                    let obj = diseaseFindings[j]
                    let label = obj.Name
                    let cui = obj.CUI
                    let frequency = obj.Frequency
                    let addClasses = ""
                    if (obj.TypeOfFinding == "NegativeMatched") {
                        addClasses = "negative-finding "
                    }
                    else {
                        addClasses = "positive-finding "
                    }

                    //add 'selected' class if cui is returned in matched-findings array (ie it was used in the search terms )
                    // addClasses += (obj.IsMatched == "true" ? "selected " : "selectable ")
                    addClasses += (obj.TypeOfFinding == "Matched" ? "selected " : "selectable ")

                    //add top-eight class for top 8 findings. These will always be displayed
                    if (j < 8) {
                        addClasses += "top-eight "
                    }

                    //add tag to the disease findings container
                    createTag($divSuggestion.find('.disease-findings'), label, cui, frequency, addClasses, null)
                }
            }

            //attach click event for more-findings button
            let btnMoreFindings = $divSuggestion.find('.btn-more-findings')
            btnMoreFindings.on("click", function () {
                $divSuggestion.toggleClass('show-findings hide-findings')
            })

            //append this new div-suggestion to the parent container
            $('#suggestions-container').append($divSuggestion)
            // searchOptions = curFindings.slice()

        }
        //populate autocomplete from disease findings
        fetchAutoCompleteFromDiseaseFindings('')
    }
    catch (ex) {
        console.log(console.log(ex))
    }
}

function clearScreen() {
    $('#selected-terms').empty()
    $('#suggestions-container').empty()
    $('.container-fluid').addClass('is-empty')

    // curFindings = []
    //clear cm editor
    view.dispatch({
        changes: {
            from: 0,
            to: view.state.doc.length,
            insert: ''
        }
    })

    view.focus()
    // startCompletion

}

//receives prevalance as input returns object representing prevalence on a scale from 1-5
function getFrequencyScale(frequency) {
    let frequency_description = ''
    let frequency_value = 0
    let frequency_range = ''
    let frequency_range_floor = 0
    let frequency_range_ceiling = 0

    if (frequency <= .025) {
        frequency_description = 'Very Rare'
        frequency_value = 1
        frequency_range_floor = 1
        frequency_range_ceiling = 4
        frequency_range = '1-4%'
    }
    else if (frequency <= 0.29) {
        frequency_description = 'Occasional'
        frequency_value = 2
        frequency_range_floor = 5
        frequency_range_ceiling = 29
        frequency_range = '5-29%'
    }
    else if (frequency <= 0.79) {
        frequency_description = 'Frequent'
        frequency_value = 3
        frequency_range_floor = 30
        frequency_range_ceiling = 79
        frequency_range = '30-79%'
    }
    else if (frequency <= (0.99)) {
        frequency_description = 'Very Frequent'
        frequency_value = 4
        frequency_range_floor = 80
        frequency_range_ceiling = 99
        frequency_range = '80-99%'
    }
    else {
        frequency_description = 'Obligate'
        frequency_value = 5
        frequency_range_floor = 100
        frequency_range_ceiling = 100
        frequency_range = '100%'
    }

    return {
        'value': frequency_value,
        'description': frequency_description,
        'range': frequency_range,
        'range_floor': frequency_range_floor,
        'range_ceiling': frequency_range_ceiling
    }
}

//receives prevalance as input returns object representing prevalence on a scale from 1-5
function getPrevalenceScale(prevalence) {
    let prevalence_description = ''
    let prevalence_value = 0

    if (prevalence < Math.pow(10, 6)) {
        prevalence_description = 'Very Low Prevalence'
        prevalence_value = 1
    }
    else if (prevalence < (1 + 9) / 2 * Math.pow(10, 6)) {
        prevalence_description = 'Low Prevalence'
        prevalence_value = 2
    }
    else if (prevalence < (1 + 9) / 2 * Math.pow(10, 5)) {
        prevalence_description = 'Medium Prevalence'
        prevalence_value = 3
    }
    else if (prevalence < (1 + 5) / 2 * Math.pow(10, 4)) {
        prevalence_description = 'Medium Prevalence'
        prevalence_value = 4
    }
    else if (prevalence < (6 + 9) / 2 * Math.pow(10, 4)) {
        prevalence_description = 'High Prevalence'
        prevalence_value = 5
    }
    else {
        prevalence_description = 'Very High Prevalence'
        prevalence_value = 6
    }

    return {
        'value': prevalence_value,
        'description': prevalence_description
    }
}

$(function () {

    particlesJS.load('particles-js', 'particlesjs.json', function () {
        console.log('callback - particles-js config loaded');
    });

    const initialState = EditorState.create({
        doc: '',
        extensions: [
            basicSetup,
            // keymap.of([indentWithTab]),
            myTheme,
            // cursorTooltip(),
            autocompletion({ override: [myCompletions] }),
            // EditorView.lineWrapping,
            // indentUnit.of("\t")
        ],
    })

    // Initialization of the EditorView
    view = new EditorView({
        parent: document.getElementById('editor'),
        state: initialState,
    })

    let element: HTMLElement = $('#editor-container')[0] as HTMLElement

    view.focus()

    $('#btnClearAll').on("click", function () {
        clearScreen()
    })

})

