import { createApp, ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
// import { createApp, ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js'

const themes = [
    { "index": 0, "className": "light", "displayName": "Light", "iconSrc": "media/alessio-atzeni-sun-icon.svg" },
    { "index": 1, "className": "dark", "displayName": "Dark", "iconSrc": "media/fa-moon-solid.svg" },
];

// Enum structure taken from https://stackoverflow.com/a/44447975
const NumberTypes = Object.freeze({
    INT: Symbol("int"),
    FLOAT: Symbol("float"),
})



// An array representing the universal stats of a character with a level equal to index.
const levelStatKey = [
    {
        "doesnt-exist": true,
        "exp": 0, "proficiencyBonus": 2
    },    // 0 (duplicate of 1, to make indexing consistent with levels)
    { "exp": 0, "proficiencyBonus": 2 },    // 1
    { "exp": 300, "proficiencyBonus": 2 },    // 2
    { "exp": 900, "proficiencyBonus": 2 },    // 3
    { "exp": 2700, "proficiencyBonus": 2 },    // 4
    { "exp": 6500, "proficiencyBonus": 3 },    // 5 *
    { "exp": 14000, "proficiencyBonus": 3 },    // 6
    { "exp": 23000, "proficiencyBonus": 3 },    // 7
    { "exp": 34000, "proficiencyBonus": 3 },    // 8
    { "exp": 48000, "proficiencyBonus": 4 },    // 9 *
    { "exp": 64000, "proficiencyBonus": 4 },    // 10
    { "exp": 85000, "proficiencyBonus": 4 },    // 11
    { "exp": 100000, "proficiencyBonus": 4 },    // 12
    { "exp": 120000, "proficiencyBonus": 5 },    // 13 *
    { "exp": 140000, "proficiencyBonus": 5 },    // 14
    { "exp": 165000, "proficiencyBonus": 5 },    // 15
    { "exp": 195000, "proficiencyBonus": 5 },    // 16
    { "exp": 225000, "proficiencyBonus": 6 },    // 17 *
    { "exp": 265000, "proficiencyBonus": 6 },    // 18
    { "exp": 305000, "proficiencyBonus": 6 },    // 19
    { "exp": 355000, "proficiencyBonus": 6 },    // 20
];



// Applies the default number format, i.e. the number format of the user's browser, then gets whatever the resulting separators are
const localeTestNumber = Intl.NumberFormat().format(1000.01);
const thousandsSeparator = localeTestNumber.charAt(1);
const decimalSeparator = localeTestNumber.charAt(5);

/**
 * Uses regex to turn a number formatted in the browser's locale into one javascript parsing functions can understand, 
 * then returns the result of the passed parser function.
 * @param {String} stringToParse 
 * @param {function(String):Number} parser 
 * @returns `stringToParse` as parsed by `parser`.
 */
function parseNumberInternational(stringToParse, parser)
{
    // Removes all thousands separators; unnecessary for parsing
    stringToParse = stringToParse.replace(new RegExp(`\\${thousandsSeparator}`, "g"), "");
    // Replaces all decimal separtors with `.`; this is the only decimal separator native javascript parsers accept
    stringToParse = stringToParse.replace(new RegExp(`\\${decimalSeparator}`, "g"), ".");

    return parser(stringToParse);
}

function formatNumber(num) { return typeof num === "number" ? Intl.NumberFormat().format(num) : num; }



createApp({
    setup()
    {
        const currentDisplayMode = ref(window.matchMedia("(prefers-color-scheme: dark)").matches ? themes[1] : themes[0]);

        const stats = ref({
            "characterName": "",
            "characterLevel": "",
            "characterClass": "",
            "playerName": "",
            "characterBackground": "",
            "characterRace": "",
            "characterSize": "",
            "characterExperience": "",
        });



        function setTheme(e, t = "")
        {
            let targetMode;
            // If t is a display mode object, just use it
            if (t.iconSrc) targetMode = t;
            // if not, try and find a matching mode (don't waste time on empty/whitespace)
            else if (typeof t === "string" && !/^\s*$/.test(t))
                targetMode = themes.find(el => el.className === t);


            // If we've got an e with a valid currentTarget, use that, otherwise go fetch the button
            let modeButton = (e ? e.currentTarget : null) ?? document.querySelector("#toggle-theme");
            // If no target mode, take the mode directly after the current one (wrapping around with %)
            targetMode ??= themes[(currentDisplayMode.value.index + 1) % themes.length];


            document.documentElement.setAttribute("class", targetMode.className);

            modeButton.setAttribute("title", `Theme: ${targetMode.displayName} - Click to switch`);
            modeButton.setAttribute("aria-label", `Theme: ${targetMode.displayName} - Click to switch`);
            modeButton.querySelector("img").setAttribute("src", targetMode.iconSrc);

            modeButton.value = targetMode.index;
            currentDisplayMode.value = targetMode;
        }


        function applyChanges(e) { stats.value[e.target.name] = e.target.value; }


        function applyParsedChanges(e, parseType, allowUnparseable = true)
        {
            let parser;
            switch (parseType)
            {
                case NumberTypes.INT:
                    parser = parseInt;
                    break;

                case NumberTypes.FLOAT:
                default:
                    parser = parseFloat;
                    break;
            }

            let parseAttempt = parseNumberInternational(e.target.value, parser);

            // If parse was successful (result is a non-NaN number), apply that to stats
            if (!Number.isNaN(+parseAttempt))
            {
                stats.value[e.target.name] = parseAttempt;
            }
            // If it wasn't, don't do anything unless we allow unparsable entries
            else if (allowUnparseable)
            {
                stats.value[e.target.name] = e.target.value;
            }
        }


        function sanitizeInt(e, allowEmpty, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) { sanitizeNumber(e, allowEmpty, num => parseNumberInternational(num, parseInt), min, max); }
        function sanitizeFloat(e, allowEmpty, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) { sanitizeNumber(e, allowEmpty, num => parseNumberInternational(num, parseFloat), min, max); }

        function sanitizeNumber(e, allowEmpty, parser, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY)
        {
            if (allowEmpty && e.target.value.trim() === "") {
                stats.value[e.target.name] = e.target.value;
                return;
            }

            // Remove all letters besides e (and mathematically invalid e's) that might have snuck in
            let sanitized = e.target.value.replace(/[a-df-z]|^e+|e+$/gi, "");

            // Remove all but the last e (match every e that has an e ahead of it), then try to parse. 
            sanitized = parser(e.target.value.replace(/e(?=.*e)/gi, ""));

            // If parsing failed (any non-number, invalid for this function), reset input to its last valid value
            if (Number.isNaN(+sanitized))
            {
                e.target.value = stats.value[e.target.name]
                return;
            }

            // Clamp to desired range; take min if it's larger than sanitized, then take max if it's smaller than sanitized.
            stats.value[e.target.name] = Math.min(Math.max(sanitized, min), max);
            e.target.value = stats.value[e.target.name];
        }



        onMounted(() =>
        {
            setTheme(null, currentDisplayMode.value);
        })

        return {
            NumberTypes,
            stats,
            levelStatKey,
            formatNumber,

            setTheme,
            applyChanges,
            applyParsedChanges,
            sanitizeInt,
            sanitizeFloat,
            sanitizeNumber
        }
    }
}).mount('#app')

