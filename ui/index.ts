import React from 'react';
import TextField from '@material-ui/core/TextField';

const axios = require('axios')
const headers = {
    'Access-Control-Allow-Origin': '*'
}

async function getRareDiseaseAutoComplete(startsWith) {
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
            return response;
        })
}

$(function () {
    var availableTags = [
        "ActionScript",
        "AppleScript",
        "Asp",
        "BASIC",
        "C",
        "C++",
        "Clojure",
        "COBOL",
        "ColdFusion",
        "Erlang",
        "Fortran",
        "Groovy",
        "Haskell",
        "Java",
        "JavaScript",
        "Lisp",
        "Perl",
        "PHP",
        "Python",
        "Ruby",
        "Scala",
        "Scheme"
    ];

    function split(val) {
        return val.split(/,\s*/);
    }
    function extractLast(term) {
        return split(term).pop();
    } ($("#symptoms") as any)
        // don't navigate away from the field on tab when selecting an item
        .on("keydown", function (event) {
            if (event.keyCode === $.ui.keyCode.TAB &&
                ($(this) as any).autocomplete("instance").menu.active) {
                event.preventDefault();
            }
        })
        .autocomplete({
            minLength: 3,
            source: function (request, response) {
                // delegate back to autocomplete, but extract the last term
                response($.ui.autocomplete.filter(
                    getRareDiseaseAutoComplete(encodeURIComponent(request.term)), extractLast(request.term)));
                // availableTags, extractLast(request.term)));
            },
            focus: function () {
                // prevent value inserted on focus
                return false;
            },
            select: function (event, ui) {
                var terms = split(this.value);
                // remove the current input
                terms.pop();
                // add the selected item
                terms.push(ui.item.value);
                // add placeholder to get the comma-and-space at the end
                terms.push("");
                this.value = terms.join(", ");
                return false;
            }
        });
});


