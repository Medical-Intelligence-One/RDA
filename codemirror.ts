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
                    let addClasses = "removeable selected"
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
        var cuis = []
        //iterate through all the tags in the selected-terms div to get the cuis
        let $selectedTags = $('#selected-terms .selection-tag.selected:not(.d-none)')
        if ($selectedTags.length > 0) {
            $selectedTags.each(function (i, obj) {
                cuis.push({
                    CUI: $(obj).find('.selection-tag-cui').text()
                    // CUI: $(obj).attr('id')
                    // CUI: "C0442874"
                })
            })
        }
        resolve({ CUIs: cuis })
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
    //add any additional classes
    $divTag.addClass(addClasses)

    //add click event to add/remove tag from selected-terms div and requery the database
    if ($divTag.hasClass('selectable')) {
        addTagTitle($divTag)

        $divTag.on("click", function () {
            $divTag.toggleClass('selected')
            let selected = $divTag.hasClass('selected')
            if (selected) {
                divSelectedTerms.append($divTag)
            }
            else {
                divSelectedTerms.find('#' + id).remove()
            }
            addTagTitle($divTag)
            fetchDiseases()
        })
    }

    //add click event to'x' symbol to remove tag from selected-terms div and requery the database
    if ($divTag.hasClass('removeable')) {
        $divTag.find(".remove-tag").on("click", function () {
            $divTag.remove()
            fetchDiseases()
        })
    }

    parentElement.append($divTag)

    if (callback) {
        callback()
    }
}

//adds a mouseover caption to a tag
function addTagTitle($divTag) {
    let title = ''
    if ($divTag.hasClass('selectable')) {
        if ($divTag.hasClass('selected')) {
            title = 'Finding used in Search. Click to Remove'
        }
        // else {
        //     if (($divTag).closest(divAssociatedFindings).length > 0) {
        //         title = "Click to add Finding to Search"
        //     }
        else {
            title = 'Finding excluded from Search. Click to Add.'
        }
        // }
    }
    $divTag.attr('title', title)
}

//display output from api call showing returned diseases with associated evidence displayed as tags
function showDiseases(data) {

    // sort data by probability 
    data.sort(function (a, b) {
        return (parseFloat(a.Disease_Probability) - parseFloat(b.Disease_Probability))
    })
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
            let floatPrevalence = parseFloat(prevalence);
            if (!isNaN(floatPrevalence))
                $divSuggestion.find('.disease-prevalence').text(floatPrevalence.toExponential())

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
                element.Rank = 1 + element.Frequency
            });
            diseaseItem.Unmatched_Findings.forEach(function (element) {
                element.IsMatched = "false";
                element.Rank = element.Frequency
            });
            diseaseFindings = diseaseItem.Matched_Findings.concat(diseaseItem.Unmatched_Findings)

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
                    let addClasses = "";

                    //add 'selected' class if cui is returned in matched-findings array (ie it was used in the search terms )
                    addClasses = "selectable " + (obj.IsMatched == "true" ? "selected " : "")
                    // if (diseaseItem.Matched_Findings.filter(function (item) { return item.CUI === cui; }).length > 0) {
                    //     addClasses += "selected "
                    // }

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

