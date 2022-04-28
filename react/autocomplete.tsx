import * as React from 'react';
// import Chip from '@mui/material/Chip';
import AutoComplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
// import AutoComplete from '@material-ui/core/'

const headers = {
    'Access-Control-Allow-Origin': '*'
}
const axios = require('axios')

{/* <Autocomplete
    inputValue={inputValue}
    onInputChange={(e) => setinputValue(event.target.value)}
    id="combo-box-demo"
    options={values}
    getOptionLabel={(option) => option}
    style={{ width: 300 }}
    renderInput={(params) => (
        <TextField {...params} label="Combo box" variant="outlined" />
    )}
    open={inputValue.length > 2}
/> */}

export default function Tags() {
    return (
        <Stack spacing={3} sx={{ width: 500 }}>
            <AutoComplete
                multiple
                // inputValue={inputValue}
                // onInputChange={(e) => setinputValue(event.target.value)}
                id="findings"
                options={diseases}
                getOptionLabel={(option) => option.Clinical_Finding}
                // defaultValue={[top100Films[13]]}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="standard"
                        label="Multiple values"
                        placeholder="Favorites"
                    />
                )}
            />
        </Stack>
    );
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

const diseases = getRareDiseaseAutoComplete("liv");
