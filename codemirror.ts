// import * as CodeMirror from "codemirror"
// import { } from "@codemirror/commands"
import { basicSetup, EditorState, EditorView } from '@codemirror/basic-setup';
// import { keymap } from "@codemirror/view"
// import { indentWithTab } from "@codemirror/commands"
import { autocompletion, CompletionContext, startCompletion } from "@codemirror/autocomplete"
// import { StateField, EditorSelection } from "@codemirror/state"
// import { Tooltip, showTooltip } from "@codemirror/tooltip"
// import { indentUnit } from '@codemirror/language'
// import rareDiseaseData from '../mi1-rare-disease/rare-diseases.json'       //test data until api is working
// import autocompleteRareDiseaseData from '../mi1-rare-disease/autocomplete_rareDz_findings.json'       //test data until api is working
// import { typeOf } from 'react-is';
import bookmarkedDiseaseData from '../mi1-rare-disease/dx1.json'       //test data until api is working
import searchHistoryData from '../mi1-rare-disease/searchHistory.json'       //test data until api is working
const axios = require('axios')
const headers = {
    'Access-Control-Allow-Origin': '*'
}
var view, inputVal
var searchOptions: any[] = []

var $selectedTerms = $('#selected-terms')
var $bookmarkedDiseasesContainer = $('#bookmarked-diseases-container')

let myTheme = EditorView.theme({
    "cm-editor": {
        fontSize: "18px",
        width: "100%",
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
        await axios.post('https://dev_api.mi1.ai/api/autocomplete_rareDz_findings', body, { headers })
            .then(function (response) {
                let autoCompleteData = response.data
                searchOptions = []

                //add autoComplete API response to autocomplete list. On selection, add tag to selected-terms div and refresh disease data 
                for (var i = 0; i <= autoCompleteData.length - 1; i++) {

                    let cui = autoCompleteData[i].Clinical_Finding_CUI
                    let name = autoCompleteData[i].Clinical_Finding
                    let frequency = null
                    let addClasses = "mini removeable selected " + ($('#search-section').hasClass('positive-search') ? 'positive-finding' : 'negative-finding')
                    searchOptions.push({
                        // info: cui,
                        label: name,
                        type: "finding",
                        apply: () => {
                            view.dispatch({
                                changes: {
                                    from: 0,
                                    to: view.state.doc.length,
                                    insert: ''
                                }
                            })
                            createTag($selectedTerms, name, cui, frequency, addClasses, fetchDiseases)
                            $('#div-selected-terms').toggleClass('d-none', false)

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
        let addClasses = "removeable selected " + ($('#search-section').hasClass('positive-search') ? 'positive-finding' : 'negative-finding')

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
                    createTag($selectedTerms, label, cui, frequency, addClasses, fetchDiseases)
                }
            })
        }
    })
}

//overrides code mirror completion event (i.e. when autocomplete suggestion is selected)
function myCompletions(context: CompletionContext) {

    let word = view.state.doc.toString();       //get content of editor

    //If <3 characters entered, populate autocomplete suggestions with unique list of findings associated with the current set of diseases
    if (word.length < 3) {
        if ($('#suggestions-container .selection-tag').length > 0) {
            fetchAutoCompleteFromDiseaseFindings(word)
        }
        else {
            searchOptions = []
            return null
        }
    }
    //>=3 characters so get autocomplete suggestions from API
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
    //use rareDiseaseSearch as endpoint if there are no negative findings
    var endPoint = 'rareDiseaseSearchPosNeg'

    //write selected CUI tag elements into array
    let cuiArrayPromise = new Promise(function (resolve) {
        sortSearchTerms()
        var matchedFindings: any[] = []
        var negativeMatchedFindings: any[] = []

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
        //resolve promise with parameter values for either 
        resolve(
            {
                // CUIs: matchedFindings
                Matched_Findings: matchedFindings,
                Negative_Matched_Findings: negativeMatchedFindings
            }
        )
    })

    //get API call response and display diseases
    await axios.post('https://dev_api.mi1.ai/api/' + endPoint, await (cuiArrayPromise), { headers })
        .then(async function (response) {
            $('#associated-findings').empty()
            $('#suggestions-container').empty()

            if (response.data.length > 0) {
                showDiseases(response.data, $('#suggestions-container'))
            }
            else {
                clearScreen()
            }
        }).catch(function (error) {
            console.log('api error: ' + error)
            clearScreen()
        });

    // return focus to codemirror input
    view.focus
    try {
        startCompletion
    }
    catch (ex) {
        console.log(console.log(ex))
    }
}

// //fetch and display bookmarked diseases
// function fetchBookmarkedDiseases(bookmarkedDiseaseName) {

//     $('#associated-findings').empty()
//     $('#bookmarked-diseases-container').empty()

//     if (bookmarkedDiseaseData.length > 0) {
//         showDiseases(bookmarkedDiseaseData, $('#bookmarked-diseases-container'))
//         $('#bookmarked-diseases-container').removeClass('d-none')
//         showHideDiseasesUsingBookmarkedDiseases()
//     }
//     else {
//         clearScreen()
//     }

//     // return focus to codemirror input
//     view.focus
//     try {
//         startCompletion
//     }
//     catch (ex) {
//         console.log(console.log(ex))
//     }
// }


//create a findings tag with click event. This has a call back function to ensure api call is done only on completion of tag creation
function createTag(parentElement, label, id, frequency, addClasses, callback) {
    //clone template to get new tag object
    let $divTag = $('#selection-tag-template').clone().removeAttr('id').removeClass('d-none')

    //populate tag with data
    $divTag.find('.selection-tag-text').text(label)
    $divTag.children('.selection-tag-cui').text(id)
    $divTag.children('.selection-tag-frequency').text(frequency)

    //set frequency indicator by changing width and position of 'empty box' element which is designed to conceal a proportion of the gradient inversely related to the frequency
    let objFrequency = getFrequencyScale(frequency)
    // $divTag.children('.selection-tag-frequency').css('background-color', 'rgba(0,0,0,' + (objFrequency.value) / 5 + ')')
    $divTag.find('.gradient-bar').attr('title', objFrequency.description + ": " + objFrequency.range)
    $divTag.find('.empty-box').attr('title', objFrequency.description + ": " + objFrequency.range)
    $divTag.find('.empty-box').css('width', ((1 - frequency) * 4.5) + .0625 + 'em')
    $divTag.find('.empty-box').css('margin-left', ((1 - frequency) * -4.5) - .0625 + 'em')  //make 1px adjustment to allow for border width

    //add any additional classes
    $divTag.addClass(addClasses)

    //add events to non-matched disease findings tags
    if ($divTag.hasClass('selectable') && !$divTag.hasClass('selected')) {
        //add click event to pos/neg option
        $divTag.find('.selection-tag-posneg .positive-finding').on("click", function () { addTagToSearchAndRequery($divTag, 'positive-finding', 'negative-finding') })
        $divTag.find('.selection-tag-posneg .negative-finding').on("click", function () { addTagToSearchAndRequery($divTag, 'negative-finding', 'positive-finding') })
        //add mouseenter events to hover area to hide gradient and display pos/neg option
        $divTag.children('.selection-tag-hover-area').on('mouseenter', function (e) {
            $divTag.find('.frequency-gradient').addClass('d-none')
            $divTag.find('.selection-tag-posneg').removeClass('d-none')
        });

        //add mouseenter events to hover area to display gradient and hide pos/neg option
        $divTag.children('.selection-tag-hover-area').on('mouseleave', function (e) {
            $divTag.find('.frequency-gradient').removeClass('d-none')
            $divTag.find('.selection-tag-posneg').addClass('d-none')
        });
    }

    //add click event to tag label text
    $divTag.find('.selection-tag-text').on('click', function (e) {
        //if the tag is already a search term, remove tag and requery, otherwise add tag to search and requery
        if ($divTag.parents('#selected-terms').length > 0) {
            $divTag.remove()
            fetchDiseases()
        }
        else if (!$divTag.hasClass('selected')) {
            addTagToSearchAndRequery($divTag, 'positive-finding', 'negative-finding')
        }
    });

    //update popover caption
    updateTagTitle($divTag)
    //append tag to either search terms on disease findings
    parentElement.append($divTag)
    //perform callback where applicable
    if (callback) {
        callback()
    }
}

//adds a tag to the search criteria as either a positive or negative finding
function addTagToSearchAndRequery($myTag, classToAdd, classToRemove) {

    $myTag.removeClass('selectable top-eight ' + classToRemove)
    $myTag.addClass('removeable selected ' + classToAdd)

    // event handling
    $myTag.find('.selection-tag-hover-area').off('mouseenter')
    $myTag.find('.selection-tag-hover-area').off('mouseleave')
    $myTag.find('.selection-tag-text').off('click')
    $myTag.find('.selection-tag-text').on('click', function () {
        $myTag.remove()
        fetchDiseases()
    })

    // append tag to search terms
    $selectedTerms.append($myTag)
    updateTagTitle($myTag)

    //requery
    fetchDiseases()
}

//adds a mouseover caption to the tag text
function updateTagTitle($divTag) {
    let textTitle = ''
    if ($divTag.hasClass('selectable') && !$divTag.hasClass('selected')) {
        textTitle = 'Click to Add to Search Terms as Positive Finding.'
    }
    else if ($divTag.hasClass('removeable')) {
        textTitle = 'Click to Remove from Search Terms'
    }
    else if ($divTag.hasClass('positive-finding selected')) {
        textTitle = 'Positive Finding used in Search Terms'
    }
    else if ($divTag.hasClass('negative-finding selected')) {
        textTitle = 'Negative Finding used in Search Terms'
    }

    $divTag.find('.selection-tag-text').attr('title', textTitle)
}

//sort search terms by pos/neg and then alphabetically
function sortSearchTerms() {

    var mylist = $selectedTerms;
    var posFindings = mylist.children('.selection-tag.positive-finding').get();
    var negFindings = mylist.children('.selection-tag.negative-finding').get();

    //sort positive findings
    posFindings.sort(function (a, b) {
        return $(a).find('.selection-tag-text').text().toUpperCase().localeCompare($(b).find('.selection-tag-text').text().toUpperCase());
    })
    $.each(posFindings, function (i, obj) {
        mylist.append(obj);
    });

    // sort negative findings
    negFindings.sort(function (a, b) {
        return $(a).find('.selection-tag-text').text().toUpperCase().localeCompare($(b).find('.selection-tag-text').text().toUpperCase());
    })
    $.each(negFindings, function (i, obj) {
        mylist.append(obj);
    });
}

//display output from api call showing returned diseases with associated evidence displayed as tags
function showDiseases(data, $parentContainer) {

    let diseaseFindings = []
    searchOptions = []      //global array

    $('.container-fluid').removeClass('is-empty')

    // populate suggestion-template with disease data and add to suggestions-container div
    try {
        for (let arrIndex = 0; arrIndex < data.length; arrIndex++) {
            let diseaseItem = data[arrIndex]
            let diseaseTag = diseaseItem.Disease.replaceAll(' ', '_')
            let $divSuggestion = $('#suggestion-template').clone().removeAttr('id').removeClass('d-none').addClass(diseaseTag)
            // let $divSuggestion = $('#suggestion-template').clone().attr('id', diseaseItem.Disease_CUI).removeClass('d-none')

            $divSuggestion.find('.disease-name').text(diseaseItem.Disease)

            $divSuggestion.find('.disease-info').text(diseaseItem.Disease_Definition)

            // let probability = Math.round(Math.abs(obj.Disease_Probability)) + '%'
            let probability = Math.round(diseaseItem.Disease_Probability)
            $divSuggestion.find('.disease-probability').text(probability)

            // prevalence measures
            let diseasePrevalence = diseaseItem.Disease_Prevalence || 0
            let diseaseAnnualIncidence = diseaseItem.Disease_Annual_Incidence || 0
            let diseaseBirthPrevalence = diseaseItem.Disease_Birth_Prevalence || 0
            let diseaseLifetimePrevalence = diseaseItem.Disease_Lifetime_Prevalence || 0
            let diseasePointPrevalence = diseaseItem.Disease_Point_Prevalence || 0
            //display max of these prevalences in label
            // let maxPrevalence = Math.max(diseasePrevalence, diseaseAnnualIncidence, diseaseBirthPrevalence, diseaseLifetimePrevalence, diseasePointPrevalence)
            let maxPrevalence = diseaseItem.Max_Prevalence_or_Incidence || 0

            let objDiseasePrevalence = getPrevalenceScale(diseasePrevalence || 0)
            let objDeaseAnnualIncidence = getPrevalenceScale(diseaseAnnualIncidence || 0)
            let objDeaseBirthPrevalence = getPrevalenceScale(diseaseBirthPrevalence || 0)
            let objDeaseLifetimePrevalence = getPrevalenceScale(diseaseLifetimePrevalence || 0)
            let objDiseasePointPrevalence = getPrevalenceScale(diseasePointPrevalence || 0)

            let $prevalence = $divSuggestion.find('.disease-prevalence')
            var prevelanceRange
            if (maxPrevalence == 0) { prevelanceRange = "Prevalence Not Known" }
            else {
                let objPrevalence = getPrevalenceScale(maxPrevalence)
                prevelanceRange = objPrevalence.range_numerator + ' / ' + objPrevalence.range_denominator.toLocaleString()


                let prevalenceTitleContent =
                    formatPrevalenceLine('Prevalence', objDiseasePrevalence) +
                    formatPrevalenceLine('Annual Incidence', objDeaseAnnualIncidence) +
                    formatPrevalenceLine('Point Prevalence', objDiseasePointPrevalence) +
                    formatPrevalenceLine('Birth Prevalence', objDeaseBirthPrevalence) +
                    formatPrevalenceLine('Lifetime Prevalence', objDeaseLifetimePrevalence)

                // if (!isNaN(floatPrevalence)) {
                // $divSuggestion.find('.disease-prevalence').css('background-color', 'rgba(0,0,0,' + (objPrevalence.value) / 5 + ')')
                // $prevalence.attr('title', prevalenceTitle)
                $prevalence.popover("dispose")
                $prevalence.popover({
                    title: "Prevalence",
                    content: prevalenceTitleContent,
                    trigger: "hover",
                    placement: "left",
                    html: true,
                    customClass: "prevalence-title"
                    // template: '<div class="popover" role="tooltip">' +
                    //     '<div class="popover-arrow"> </div>' +
                    //     '<h3 class="popover-header"> </h3 >' +
                    //     '<div class="popover-body"> </div > </div > '
                })
            }
            $prevalence.text(prevelanceRange)

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

            $divSuggestion.find('.expand-contract').on("click", function (e) {
                $divSuggestion.toggleClass('contracted');
            })

            //add/remove suggestion to bookmark list when bookmark selected/deselected
            $divSuggestion.find('.disease-bookmark').on("click", function (e) {
                var $bookmarkIcon = $('.' + diseaseTag + ' .disease-bookmark')      //include suggestions in both the bookmarked list and diseases list

                $bookmarkIcon.toggleClass('active')
                $bookmarkIcon.toggleClass('far')
                $bookmarkIcon.toggleClass('fas')

                if ($bookmarkIcon.hasClass('active')) {
                    let $divSuggestionClone = $divSuggestion.clone(true)        //clone elements and events
                    $divSuggestionClone.find('.expand-contract').on("click", function (e) {
                        $divSuggestionClone.toggleClass('contracted');
                    })
                    $bookmarkedDiseasesContainer.append($divSuggestionClone)
                }
                else {
                    $bookmarkedDiseasesContainer.find('.' + diseaseTag).remove()
                }
                if ($('#bookmarked-diseases-container .div-suggestion').length == 0) {
                    $bookmarkedDiseasesContainer.toggleClass('d-none', true)
                }
                else {
                    $bookmarkedDiseasesContainer.toggleClass('d-none', false)
                }

            })

            //populate findings div for diagnosis and associated findings div for top 3 diagnoses
            //create isMatched property and concatenate matched and unmatched findings
            if (typeof diseaseItem.Matched_Findings !== 'undefined') {
                diseaseItem.Matched_Findings.forEach(function (element) {
                    element.IsMatched = "true";
                    element.Rank = 2 + element.Frequency
                    element.TypeOfFinding = "Matched"
                })
                diseaseFindings = diseaseItem.Matched_Findings
            }

            if (typeof diseaseItem.Unmatched_Findings !== 'undefined') {
                diseaseItem.Unmatched_Findings.forEach(function (element) {
                    element.IsMatched = "false";
                    element.Rank = element.Frequency
                    element.TypeOfFinding = "Unmatched"
                })
                diseaseFindings = diseaseFindings.concat(diseaseItem.Unmatched_Findings)
            }

            if (typeof diseaseItem.Neg_Matched_Findings !== 'undefined') {
                diseaseItem.Neg_Matched_Findings.forEach(function (element) {
                    element.IsMatched = "false";
                    element.Rank = 1 + element.Frequency
                    element.TypeOfFinding = "NegativeMatched"
                })
                diseaseFindings = diseaseFindings.concat(diseaseItem.Neg_Matched_Findings)
            }

            // sort data by rank
            diseaseFindings.sort(function (a: any, b: any) {
                return (parseFloat(b.Rank) - parseFloat(a.Rank))
            })

            //iterate through findings
            if (diseaseFindings != null) {
                for (let j = 0; j < diseaseFindings.length; j++) {
                    let obj: any = diseaseFindings[j]
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
                    addClasses += ((obj.TypeOfFinding == "Matched" || obj.TypeOfFinding == "NegativeMatched") ? "selected " : "selectable ")

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
            $parentContainer.append($divSuggestion)

        }
        //populate autocomplete from disease findings
        fetchAutoCompleteFromDiseaseFindings('')
        $('.popover').hide()
    }
    catch (ex) {
        console.log(console.log(ex))
    }
}

//return a single line for the prevalence popover given the label and value
function formatPrevalenceLine(label, objValue) {
    if (objValue.value == 0) { return '' }
    else {
        // return label + '.'.repeat(35 - label.length - objValue.range_numerator.length - objValue.range_denominator.toLocaleString().length) +
        //     objValue.range_numerator + ' / ' + objValue.range_denominator.toLocaleString() + "<br>"
        console.log("<span style='width:40px;text-align:left'>" + label + "</span><span style='width:20px;text-align:right'>" +
            objValue.range_numerator + ' / ' + objValue.range_denominator.toLocaleString() + "</span>")
        return "<div><span class='prevalence-label'>" + label + "</span><span class='prevalence-range'>" +
            objValue.range_numerator + ' / ' + objValue.range_denominator.toLocaleString() + "</span></div>"

    }
}

//clear screen (clearing selected terms is optional)
function clearScreen(clearSelectedTerms = false) {
    if (clearSelectedTerms) {
        $selectedTerms.empty()
        $('#div-selected-terms').toggleClass('d-none', true)
    }

    $('#suggestions-container').empty()
    $('#bookmarked-diseases-container').empty()
    $('.container-fluid').addClass('is-empty')
    $('.search-editor').toggleClass('d-none', false)
    $('#search-history').toggleClass('d-none', true)

    //clear cm editor
    view.dispatch({
        changes: {
            from: 0,
            to: view.state.doc.length,
            insert: ''
        }
    })
    view.focus()
}

//receives frequency as input. Returns object representing prevalence on a scale from 1-5
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

//receives prevalance as input. Returns object representing prevalence on a scale from 1-5
function getPrevalenceScale(prevalence) {
    let prevalence_description = ''
    let prevalence_value = 0
    let prevalence_range_numerator = ''
    let prevalence_range_denominator = 0

    if (prevalence == 0) {
        prevalence_range_numerator = ''
        prevalence_range_denominator = 0
        prevalence_value = 0
    }
    // else if (prevalence = Math.pow(10, -6)) {
    else if (prevalence <= 1 / 1000000) {
        prevalence_range_numerator = '< 1'
        prevalence_range_denominator = 1000000
        prevalence_value = 1
    }
    // else if (prevalence = (1 + 9) / 2 * Math.pow(10, -6)) {
    else if (prevalence <= (1 + 9) / 2 / 1000000) {
        prevalence_range_numerator = '1-9'
        prevalence_range_denominator = 1000000
        prevalence_value = 2
    }
    else if (prevalence <= (1 + 9) / 2 / 100000) {
        prevalence_range_numerator = '1-9'
        prevalence_range_denominator = 100000
        prevalence_value = 3
    }
    else if (prevalence <= (1 + 5) / 2 / 10000) {
        prevalence_range_numerator = '1-5'
        prevalence_range_denominator = 10000
        prevalence_value = 4
    }
    else if (prevalence <= (6 + 9) / 2 / 10000) {
        prevalence_range_numerator = '6-9'
        prevalence_range_denominator = 10000
        prevalence_value = 5
    }
    else if (prevalence <= 1 / 1000) {
        prevalence_range_numerator = '>1'
        prevalence_range_denominator = 1000
        prevalence_value = 6
    }

    return {
        'value': prevalence_value,
        'description': prevalence_description,
        'range_denominator': prevalence_range_denominator,
        'range_numerator': prevalence_range_numerator
    }
}

// //show/hide items in disease list depending on whether they appear in bookmarked-disease list
// function showHideDiseasesUsingBookmarkedDiseases() {
//     var hideSuggestion
//     $('#suggestions-container .div-suggestion').each(function (i1, s,) {
//         hideSuggestion = false
//         $('#bookmarked-diseases-container .div-suggestion').each(function (i2, d) {
//             if ($(s).find('.disease-name').text() === $(d).find('.disease-name').text()) {
//                 hideSuggestion = true
//             }
//         })
//         $(s).toggleClass('d-none', hideSuggestion)
//     })
// }

//show the search history
function showSearchHistory(data) {
    var $searchHistoryLine = $(), $divTag = $()
    var searchDate, searchTime
    var oldSearchDate

    //remove existing history
    $('#search-history .search-history-line-template').remove()

    //iterate through json data
    $(data.searchHistory).each(function (i, d) {
        $searchHistoryLine = $('#search-history-line-template').clone().removeAttr('id')

        searchDate = new Date(d.datetime).toLocaleDateString()
        searchTime = new Date(d.datetime).toLocaleTimeString()

        //hide date header if not applicable
        $searchHistoryLine.find('.date-header').text(new Date(d.datetime).toLocaleDateString())
        if (searchDate == oldSearchDate && oldSearchDate != undefined) {
            $searchHistoryLine.find('.date-header').hide()
        }
        oldSearchDate = searchDate

        $searchHistoryLine.find('.search-time').text(searchTime)

        //make save icon invisible if not applicable
        if (d.saved != "true") {
            $searchHistoryLine.find('.save-icon').css('visibility', 'hidden')
        }

        //add findings tags
        $(d.searchTerms).each(function (i2, d2) {
            $divTag = $("<span class='tag'>" + d2.name + "</span>")
            $divTag.data('cui', d2.cui)
            $divTag.addClass(d2.posneg == 'pos' ? 'positive-search' : 'negative-search')
            $searchHistoryLine.find('.search-history-line').append($divTag)
        })

        //append searchHistoryLine to div
        $('#search-history').append($searchHistoryLine)
    })

    //add event to trigger search when line is clicked
    $('#search-history .search-history-line').on("click", function (e) {
        $selectedTerms.empty()
        var addClasses
        $(e.currentTarget).children('.tag').each(function (i, t) {
            addClasses = "mini removeable selected " + ($(t).hasClass('positive-search') ? 'positive-finding' : 'negative-finding')
            createTag($selectedTerms, $(t).text(), $(t).data("cui"), null, addClasses, fetchDiseases)
        })
        $('#div-selected-terms').toggleClass('d-none', false)
    })
}

//code fired after each page load
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

    //bind Clear All button click event
    $('#btnClearAll').on("click", function () {
        clearScreen(true)
    })

    //bind pos/neg toggle change event
    $('#posneg-state').on("change", function () {
        if (this.checked) {
            $('#search-section').addClass('negative-search')
            $('#search-section').removeClass('positive-search')
        }
        else {
            $('#search-section').addClass('positive-search')
            $('#search-section').removeClass('negative-search')
        }
        view.focus()

    });

    // $('#bookmarked-diseases-dropdown li').on('click', function (e) {
    //     fetchBookmarkedDiseases('dx1')
    //     inputVal = $(e.target).text()
    //     $('#bookmarked-diseases-label').text(inputVal);

    // })

    // $('#new-bookmarked-disease-textbox').on("keypress", function (e) {
    //     if (e.which == 13) {
    //         inputVal = $(this).val()?.toString() + '';
    //         $('#bookmarked-diseases-label').text(inputVal);
    //         $('#bookmarked-diseases-dropdown .rda-dropdown-items').hide()
    //     }
    // })

    //contract/expand all bookmarked diseases
    $('#rda-header-bookmarked-diseases').on("click", function (e) {
        $(e.currentTarget).toggleClass('contracted');
        let isContracted = $(e.currentTarget).hasClass('contracted')
        $(e.currentTarget).next().find('.div-suggestion').toggleClass('contracted', isContracted);
    })

    //show/hide search history
    $('#btnSearchHistory, #imgSearchHistory').on("click", function () {
        $('.search-editor').toggleClass('d-none')
        $('#search-history').toggleClass('d-none')
        if (!$('#search-history').hasClass('d-none')) {
            showSearchHistory(searchHistoryData)
        }
    })

    $('#close-search-history').on("click", function () {
        $('.search-editor').toggleClass('d-none', false)
        $('#search-history').toggleClass('d-none', true)
    })

    //contract/expand all diseases
    $('#rda-header-diseases').on("click", function (e) {
        $(e.currentTarget).toggleClass('contracted');
        let isContracted = $(e.currentTarget).hasClass('contracted')
        $(e.currentTarget).next().find('.div-suggestion').toggleClass('contracted', isContracted);
    })

    //page info popover
    // $('#page-info-popover').popover("dispose")
    // $('#page-info-popover').popover({
    //     title: "",
    //     content: $('#page-info-template').html(),
    //     trigger: "hover",
    //     placement: "auto",
    //     html: true,
    //     customClass: "prevalence-title"
    // })
})

