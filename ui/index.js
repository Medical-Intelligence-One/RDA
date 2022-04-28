const headers = {
    'Access-Control-Allow-Origin': '*'
}
async function fetchAutoComplete(startsWith) {

    const body = {
        "startsWith":
            [
                {
                    "startsWith": startsWith
                }
            ]
    }

    $.ajax({
        method: "POST",
        url: "https://api.mi1.ai/api/autocomplete_rareDz_findings",
        body: body,
        headers: headers,
        dataType: "json",
    }).done(function (result) {

        // if (response.data.length > 0) {
        //     searchOptions = []
        // }

        $("#symptoms").autocomplete({
            source: result
        });

    }).catch(function (error) { console.log(error) }).then(function () { })

}