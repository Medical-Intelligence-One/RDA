"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
// import * as CodeMirror from "codemirror"
// import { } from "@codemirror/commands"
var basic_setup_1 = require("@codemirror/basic-setup");
var autocomplete_1 = require("@codemirror/autocomplete");
var axios = require('axios');
var headers = {
    'Access-Control-Allow-Origin': '*'
};
var view;
var searchOptions = [];
var diseaseFindings = [];
// var curFindings = []
var myCodeMirror;
// var arrCUIs = []
// var codemirror = $('#editor').nextAll('.CodeMirror')[0]
var divSelectedTerms = $('#selected-terms');
// var divAssociatedFindings = $('#associated-findings')
var myTheme = basic_setup_1.EditorView.theme({
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
}, { dark: false });
//refresh autocomplete list for findings using startsWith phrase
function fetchAutoCompleteFromAPI(startsWith) {
    return __awaiter(this, void 0, void 0, function () {
        var autoCompleteData, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    autoCompleteData = [];
                    if (!(startsWith.length >= 3)) return [3 /*break*/, 2];
                    body = {
                        "startsWith": [
                            {
                                "startsWith": startsWith
                            }
                        ]
                    };
                    // autoCompleteData = autocompleteRareDiseaseData
                    return [4 /*yield*/, axios.post('https://api.mi1.ai/api/autocomplete_rareDz_findings', body, { headers: headers })
                        .then(function (response) {
                            var autoCompleteData = response.data;
                            searchOptions = [];
                            var _loop_1 = function () {
                                var cui = autoCompleteData[i].Clinical_Finding_CUI;
                                var name_1 = autoCompleteData[i].Clinical_Finding;
                                var frequency = null;
                                var addClasses = "removeable selected";
                                searchOptions.push({
                                    info: cui,
                                    label: name_1,
                                    apply: function () {
                                        view.dispatch({
                                            changes: {
                                                from: 0,
                                                to: view.state.doc.length,
                                                insert: ''
                                            }
                                        });
                                        createTag(divSelectedTerms, name_1, cui, frequency, addClasses, fetchDiseases);
                                    }
                                });
                            };
                            // if (autoCompleteData.length > 0) {
                            //     searchOptions = []
                            //     searchOptions = searchOptions.concat(curFindings)
                            // }
                            // searchOptions = curFindings.slice()
                            //add autoComplete API response to autocomplete list. On selection, add tag to selected-terms div and refresh disease data 
                            for (var i = 0; i <= autoCompleteData.length - 1; i++) {
                                _loop_1();
                            }
                        })["catch"](function (error) { console.log(error); }).then(function () { })];
                case 1:
                    // autoCompleteData = autocompleteRareDiseaseData
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
//populates autocomplete searchoptions using disease findings
function fetchAutoCompleteFromDiseaseFindings(contains) {
    searchOptions = [];
    var $divFindings = $('#suggestions-container .selection-tag');
    var allFindings = [];
    $divFindings.each(function (i, obj) {
        var cui = $(obj).find('.selection-tag-cui').text();
        var label = $(obj).find('.selection-tag-text').text();
        var frequency = $(obj).find('.selection-tag-frequency').text();
        if (!searchOptions.some(function (e) {
            if (e.info == cui && e.label == label) {
                return true;
            }
        }) && label.toLowerCase().indexOf(contains.toLowerCase()) >= 0) {
            searchOptions.push({
                info: cui,
                label: label,
                apply: function () {
                    view.dispatch({
                        changes: {
                            from: 0,
                            to: view.state.doc.length,
                            insert: ''
                        }
                    });
                    createTag(divSelectedTerms, label, cui, frequency, "removeable selected", fetchDiseases);
                }
            });
        }
    });
}
function myCompletions(context) {
    var word = view.state.doc.toString(); //get content of editor
    //cancel autocomplete if <3 characters entered and there are no tags in the selected terms div
    if (word.length < 3) {
        if ($('#suggestions-container .selection-tag').length > 0) {
            fetchAutoCompleteFromDiseaseFindings(word);
        }
        else {
            searchOptions = [];
            return null;
        }
    }
    else {
        fetchAutoCompleteFromAPI(word);
    }
    return {
        from: 0,
        options: searchOptions
    };
}
var state = basic_setup_1.EditorState.create({
    doc: "Press Ctrl-Space in here...\n",
    extensions: [basic_setup_1.basicSetup, (0, autocomplete_1.autocompletion)({ override: [myCompletions], defaultKeymap: true }),
    ]
});
//returns Diseases based on selected CUIS
function fetchDiseases() {
    return __awaiter(this, void 0, void 0, function () {
        var cuiArrayPromise, _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    cuiArrayPromise = new Promise(function (resolve) {
                        var cuis = [];
                        //iterate through all the tags in the selected-terms div to get the cuis
                        var $selectedTags = $('#selected-terms .selection-tag.selected:not(.d-none)');
                        if ($selectedTags.length > 0) {
                            $selectedTags.each(function (i, obj) {
                                cuis.push({
                                    CUI: $(obj).find('.selection-tag-cui').text()
                                    // CUI: $(obj).attr('id')
                                    // CUI: "C0442874"
                                });
                            });
                        }
                        resolve({ CUIs: cuis });
                    });
                    _b = (_a = axios).post;
                    _c = ['https://api.mi1.ai/api/rareDiseaseSearch'];
                    return [4 /*yield*/, (cuiArrayPromise)];
                case 1: return [4 /*yield*/, _b.apply(_a, _c.concat([_d.sent(), { headers: headers }]))
                    // await axios.post('https://api.mi1.ai/api/PotentialComorbidities', await (cuiArrayPromise), { headers })
                    .then(function (response) {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                $('#associated-findings').empty();
                                $('#suggestions-container').empty();
                                if (response.data.length > 0) {
                                    showDiseases(response.data);
                                }
                                else {
                                    clearScreen();
                                }
                                return [2 /*return*/];
                            });
                        });
                    })["catch"](function (error) {
                        console.log('api error: ' + error);
                        clearScreen();
                    })];
                case 2:
                    _d.sent();
                    // showDiseases(rareDiseaseData)
                    view.focus;
                    try {
                        autocomplete_1.startCompletion;
                    }
                    catch (ex) {
                        console.log(console.log(ex));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
//create a findings tag with click event. This has a call back function to ensure api call is done only on completion of tag creation
function createTag(parentElement, label, id, frequency, addClasses, callback) {
    // var htmlString = "<span class='finding-tag' id='" + info + "'>" + label + "</span><span class='close'></span>"
    var $divTag = $('#selection-tag-template').clone().removeAttr('id').removeClass('d-none');
    $divTag.children('.selection-tag-text').text(label);
    $divTag.children('.selection-tag-cui').text(id);
    $divTag.children('.selection-tag-frequency').text(frequency);
    //add any additional classes
    $divTag.addClass(addClasses);
    //add click event to add/remove tag from selected-terms div and requery the database
    if ($divTag.hasClass('selectable')) {
        addTagTitle($divTag);
        $divTag.on("click", function () {
            $divTag.toggleClass('selected');
            var selected = $divTag.hasClass('selected');
            if (selected) {
                divSelectedTerms.append($divTag);
            }
            else {
                divSelectedTerms.find('#' + id).remove();
            }
            addTagTitle($divTag);
            fetchDiseases();
        });
        $divTag.children('.posneg-finding').on("click", function (e) {
            $(e).toggleClass('positive-finding negative-finding');
        });
        //add click event to'x' symbol to remove tag from selected-terms div and requery the database
        if ($divTag.hasClass('removeable')) {
            $divTag.find(".remove-tag").on("click", function () {
                $divTag.remove();
                fetchDiseases();
            });
        }
        parentElement.append($divTag);
        if (callback) {
            callback();
        }
    }
}
//adds a mouseover caption to a tag
function addTagTitle($divTag) {
    var title = '';
    if ($divTag.hasClass('selectable')) {
        if ($divTag.hasClass('selected')) {
            title = 'Finding used in Search. Click to Remove';
        }
        // else {
        //     if (($divTag).closest(divAssociatedFindings).length > 0) {
        //         title = "Click to add Finding to Search"
        //     }
        else {
            title = 'Finding excluded from Search. Click to Add.';
        }
        // }
    }
    $divTag.attr('title', title);
}
//display output from api call showing returned diseases with associated evidence displayed as tags
function showDiseases(data) {
    // sort data by probability 
    data.sort(function (a, b) {
        return (parseFloat(a.Disease_Probability) - parseFloat(b.Disease_Probability));
    });
    diseaseFindings = [];
    searchOptions = [];
    $('.container-fluid').removeClass('is-empty');
    // curFindings = []
    // populate suggestion-template with disease data and add to suggestions-container div
    try {
        var _loop_2 = function (arrIndex) {
            var diseaseItem = data[arrIndex];
            var $divSuggestion = $('#suggestion-template').clone().removeAttr('id').removeClass('d-none');
            // let $divSuggestion = $('#suggestion-template').clone().attr('id', diseaseItem.Disease_CUI).removeClass('d-none')
            $divSuggestion.find('.disease-name').text(diseaseItem.Disease);
            $divSuggestion.find('.disease-info').text(diseaseItem.Disease_Definition);
            // let probability = Math.round(Math.abs(obj.Disease_Probability)) + '%'
            var probability = Math.round(diseaseItem.Disease_Probability);
            $divSuggestion.find('.disease-probability').text(probability);
            var prevalence = diseaseItem.Disease_Prevalence;
            var floatPrevalence = parseFloat(prevalence);
            if (!isNaN(floatPrevalence))
                $divSuggestion.find('.disease-prevalence').text(floatPrevalence.toExponential());
            //publications
            var evidence = diseaseItem.Disease_Finding_Assoc_Evidence;
            var publicationsHtmlString = '';
            if (evidence != null) {
                for (var j = 0; j < evidence.length; j++) {
                    var url = evidence[j];
                    publicationsHtmlString += '<a class="publication-url" href=' + url + ' target="_blank">' + (j + 1);
                }
                publicationsHtmlString = "Publications:" + publicationsHtmlString;
            }
            //connected papers
            $divSuggestion.find('.connected-papers').attr('title', 'Search Connected Papers for ' + diseaseItem.Disease);
            $divSuggestion.find('.connected-papers').on("click", function (el) {
                var url = "https://www.connectedpapers.com/search?q=" + diseaseItem.Disease;
                window.open(url, '_blank').focus();
            });
            // $divSuggestion.find('.associated-evidence').attr('data-bs-original-title', publicationsHtmlString)
            if (publicationsHtmlString == '') {
                $divSuggestion.find('.disease-evidence').hide();
            }
            else {
                $divSuggestion.find('.disease-evidence').append(publicationsHtmlString);
            }
            $divSuggestion.find('.suggestion-header').on("click", function (e) {
                $divSuggestion.toggleClass('contracted');
            });
            // * * populate findings div for diagnosis and associated findings div for top 3 diagnoses
            //create isMatched property and concatenate matched and unmatched findings
            diseaseItem.Matched_Findings.forEach(function (element) {
                element.IsMatched = "true";
                element.Rank = 1 + element.Frequency;
            });
            diseaseItem.Unmatched_Findings.forEach(function (element) {
                element.IsMatched = "false";
                element.Rank = element.Frequency;
            });
            diseaseFindings = diseaseItem.Matched_Findings.concat(diseaseItem.Unmatched_Findings);
            // sort data by frequency
            diseaseFindings.sort(function (a, b) {
                return (parseFloat(b.Rank) - parseFloat(a.Rank));
            });
            //eliminate duplicates
            //iterate through findings
            if (diseaseFindings != null) {
                for (var j = 0; j < diseaseFindings.length; j++) {
                    var obj = diseaseFindings[j];
                    var label = obj.Name;
                    var cui = obj.CUI;
                    var frequency = obj.Frequency;
                    var addClasses = "";
                    //add 'selected' class if cui is returned in matched-findings array (ie it was used in the search terms )
                    addClasses = "selectable " + (obj.IsMatched == "true" ? "selected " : "");
                    // if (diseaseItem.Matched_Findings.filter(function (item) { return item.CUI === cui; }).length > 0) {
                    //     addClasses += "selected "
                    // }
                    //add top-eight class for top 8 findings. These will always be displayed
                    if (j < 8) {
                        addClasses += "top-eight ";
                    }
                    //add tag to the disease findings container
                    createTag($divSuggestion.find('.disease-findings'), label, cui, frequency, addClasses, null);
                }
            }
            //attach click event for more-findings button
            var btnMoreFindings = $divSuggestion.find('.btn-more-findings');
            btnMoreFindings.on("click", function () {
                $divSuggestion.toggleClass('show-findings hide-findings');
            });
            //append this new div-suggestion to the parent container
            $('#suggestions-container').append($divSuggestion);
        };
        for (var arrIndex = 0; arrIndex < data.length; arrIndex++) {
            _loop_2(arrIndex);
        }
        //populate autocomplete from disease findings
        fetchAutoCompleteFromDiseaseFindings('');
    }
    catch (ex) {
        console.log(console.log(ex));
    }
}
function clearScreen() {
    $('#selected-terms').empty();
    $('#suggestions-container').empty();
    $('.container-fluid').addClass('is-empty');
    // curFindings = []
    //clear cm editor
    view.dispatch({
        changes: {
            from: 0,
            to: view.state.doc.length,
            insert: ''
        }
    });
    view.focus();
    // startCompletion
}
$(function () {
    particlesJS.load('particles-js', 'particlesjs.json', function () {
        console.log('callback - particles-js config loaded');
    });
    var initialState = basic_setup_1.EditorState.create({
        doc: '',
        extensions: [
            basic_setup_1.basicSetup,
            // keymap.of([indentWithTab]),
            myTheme,
            // cursorTooltip(),
            (0, autocomplete_1.autocompletion)({ override: [myCompletions] }),
            // EditorView.lineWrapping,
            // indentUnit.of("\t")
        ]
    });
    // Initialization of the EditorView
    view = new basic_setup_1.EditorView({
        parent: document.getElementById('editor'),
        state: initialState
    });
    var element = $('#editor-container')[0];
    view.focus();
    $('#btnClearAll').on("click", function () {
        clearScreen();
    });
});
