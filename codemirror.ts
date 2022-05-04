import { basicSetup, EditorState, EditorView } from '@codemirror/basic-setup';
import { keymap } from "@codemirror/view"
import { indentWithTab } from "@codemirror/commands"
import { autocompletion, CompletionContext } from "@codemirror/autocomplete"
import { StateField, EditorSelection } from "@codemirror/state"
import { Tooltip, showTooltip } from "@codemirror/tooltip"
import { indentUnit } from '@codemirror/language'
import dataFromFile from '../mi1-rare-disease/rare-diseases.json'       //test data until api is working
const axios = require('axios')
const headers = {
    'Access-Control-Allow-Origin': '*'
}
var view
var searchOptions = []
// var arrCUIs = []
// var codemirror = $('#editor').nextAll('.CodeMirror')[0]

var divSelectedTerms = $('#selected-terms')
var divAssociatedFindings = $('#associated-findings')

let myTheme = EditorView.theme({
    "cm-editor": {
        fontSize: "18px",
        width: "100%",
        // minHeight: "600px",
        outline: 0,
        border: 0,
        fontFamily: 'Verdana'
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
        fontFamily: "Verdana"
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
        lineHeight: 1.8,
        fontFamily: "Verdana",
        textAlign: "left"

    },
    ".cm-tooltip": {
        fontSize: "14px",
        fontFamily: 'Verdana'
    },
    ".cm-lineWrapping": {
        // wordBreak: "break-all",
    }
}, { dark: false })



async function fetchAutoComplete(startsWith) {

    const body = {
        "startsWith":
            [
                {
                    "startsWith": startsWith
                }
            ]
    }

    await axios.post('https://api.mi1.ai/api/autocomplete_rareDz_findings', body, { headers })
        .then(function (response) {

            if (response.data.length > 0) {
                searchOptions = []
            }

            for (var i = 0; i <= response.data.length - 1; i++) {

                let info = response.data[i].Clinical_Finding_CUI
                let label = response.data[i].Clinical_Finding
                let frequency = null
                let addClasses = "selectable selected"
                searchOptions.push({
                    info: info,
                    label: label,
                    apply: () => {
                        view.dispatch({
                            changes: {
                                from: 0,
                                to: view.state.doc.length,
                                insert: ''
                            }
                        })
                        createTag(divSelectedTerms, label, info, frequency, addClasses, fetchDiseases)

                    }
                })

            }

        }).catch(function (error) { console.log(error) }).then(function () { })
}

function myCompletions(context: CompletionContext) {
    let word = view.state.doc.toString();       //get content of editor

    if (word.length < 3) {
        searchOptions = []
        return null
    }
    else {
        fetchAutoComplete(word)
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
        let $selectedTags = $('.selection-tag.selected:not(.d-none)')
        if ($selectedTags.length > 0) {
            $selectedTags.each(function (i, obj) {
                cuis.push({
                    CUI: $(obj).attr('id')
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

            showDiseases(response.data)
        }).catch(function (error) {
            console.log('api error')
            $('#associated-findings').empty()
            $('#suggestions-container').empty()
            // $('.preloader').addClass('d-none')
        });

    // showDiseases(dataFromFile);
}

//create a findings tag with click event. This has a call back function to ensure api call is done only on completion of tag creation
function createTag(parentElement, label, id, frequency, addClasses, callback) {
    // var htmlString = "<span class='finding-tag' id='" + info + "'>" + label + "</span><span class='close'></span>"
    var $divTag = $('#selection-tag-template').clone().attr('id', id).removeClass('d-none')

    $divTag.children('.selection-tag-text').text(label)
    $divTag.children('.selection-tag-frequency').text(frequency)
    //add any additional classes
    $divTag.addClass(addClasses)

    //add click event if this tag is selectable
    if ($divTag.hasClass('selectable')) {
        addTagTitle($divTag)

        $divTag.on("click", function () {
            $divTag.toggleClass('selected')
            let selected = $divTag.hasClass('selected')
            //if element is in associated findings, add/remove this from selected terms
            if (($divTag).closest(divAssociatedFindings).length > 0) {
                if (selected) {
                    divSelectedTerms.append($divTag)
                }
                else {
                    divSelectedTerms.find('#' + id).remove()
                }

            }
            addTagTitle($divTag)
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
        else {
            if (($divTag).closest(divAssociatedFindings).length > 0) {
                title = "Click to add Finding to Search"
            }
            else {
                title = 'Finding excluded from Search. Click to Add.'
            }
        }
    }
    $divTag.attr('title', title)
}

//display output from api call showing returned diseases with associated evidence displayed as tags
function showDiseases(data) {

    //sort data by probability 
    // data.sort(function (a, b) {
    //     return (parseFloat(a.Disease_Probability) - parseFloat(b.Disease_Probability))
    // })

    // var obj = JSON.parse(response.data)
    try {
        for (let arrIndex = 0; arrIndex < data.length; arrIndex++) {
            let obj = data[arrIndex]
            let $divSuggestion = $('#suggestion-template').clone().attr('id', obj.Disease_CUI).removeClass('d-none')

            $divSuggestion.find('.disease-name').text(obj.Disease)

            $divSuggestion.find('.disease-info').text(obj.Disease_Definition)

            // let probability = Math.round(Math.abs(obj.Disease_Probability)) + '%'
            let probability = Math.round(obj.Disease_Probability)
            $divSuggestion.find('.disease-probability').text(probability)

            let prevalence = obj.Disease_Prevalence
            let floatPrevalence = parseFloat(prevalence);
            if (!isNaN(floatPrevalence))
                $divSuggestion.find('.disease-prevalence').text(floatPrevalence.toExponential())

            let evidence = obj.Disease_Finding_Assoc_Evidence
            let publicationsHtmlString = '';
            if (evidence != null) {
                for (let j = 0; j < evidence.length; j++) {
                    let url = evidence[j]
                    publicationsHtmlString += '<a class="publication-url" href=' + url + ' target="_blank">' + (j + 1)
                }
                publicationsHtmlString = "Publications:" + publicationsHtmlString
            }
            // $divSuggestion.find('.associated-evidence').attr('data-bs-original-title', publicationsHtmlString)
            if (publicationsHtmlString == '') {
                $divSuggestion.find('.disease-evidence').hide()
            }
            else {
                $divSuggestion.find('.disease-evidence').append(publicationsHtmlString)
            }

            $divSuggestion.find('.expand-contract').on("click", function (e) {
                // $(e.currentTarget).parents('.suggestions-container').toggleClass('contracted');
                $divSuggestion.toggleClass('contracted');
            })

            //populate findings div for diaganosis and associated findings div for top 3 diagnoses
            let matchedFindings = obj.Matched_Findings
            let unMatchedFindings = obj.Unmatched_Findings

            if (matchedFindings != null) {
                for (let j = 0; j < matchedFindings.length; j++) {
                    let obj = matchedFindings[j]
                    let label = obj.Name
                    let id = obj.CUI
                    let frequency = obj.Frequency
                    let addClasses = "matched"
                    createTag($divSuggestion.find('.disease-findings'), label, id, frequency, addClasses, null)
                    //if this is one on of the top 3 suggested diseases, also add the tag to the associated findings div

                }
            }

            if (unMatchedFindings != null) {
                for (let j = 0; j < unMatchedFindings.length; j++) {
                    let obj = unMatchedFindings[j]
                    let label = obj.Name
                    let id = obj.CUI
                    let frequency = obj.Frequency
                    let addClasses = ""

                    createTag($divSuggestion.find('.disease-findings'), label, id, frequency, addClasses, null)
                    //if this is one on of the top 3 suggested diseases, also add the tag to the associated findings div if not already in this or the 
                    //selected terms div
                    if (arrIndex < 3 && divAssociatedFindings.find('#' + id).length == 0 && divSelectedTerms.find('#' + id).length == 0) {
                        addClasses = "selectable"
                        createTag(divAssociatedFindings, label, id, frequency, addClasses, null)
                    }

                }
            }
            $('#suggestions-container').append($divSuggestion)
        }
    }
    catch (ex) {
        console.log(console.log(ex))
    }
}

$(function () {

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
        $('#selected-terms').empty()
        $('#associated-findings').empty()
        $('#suggestions-container').empty()
        view.focus()

    })

})

