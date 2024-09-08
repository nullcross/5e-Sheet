import { createApp, ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
// import { createApp, ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js'

const themes = [
    { "index": 0, "className": "light", "displayName": "Light", "iconSrc": "media/alessio-atzeni-sun-icon.svg" },
    { "index": 1, "className": "dark", "displayName": "Dark", "iconSrc": "media/fa-moon-solid.svg" },
];

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

const localeTestNumber = Intl.NumberFormat().format("1,000.01");
const thousandsSeparator = localeTestNumber.charAt(1);
const decimalSeparator = localeTestNumber.charAt(5);

function parseIntFormatted(stringToParse)
{
    return parseInt(stringToParse.replace(new RegExp(`\\${thousandsSeparator}|\\${decimalSeparator}.*$`, "g"), ""));
}

createApp({
    setup()
    {
        const currentDisplayMode = ref(window.matchMedia("(prefers-color-scheme: dark)").matches ? themes[1] : themes[0]);

        const stats = ref({
            "characterName": "",
            "characterLevel": 0,
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


        function applyParsedChanges(e, preferUnparsed = false)
        {
            let parseAttempt = parseIntFormatted(e.target.value);

            // Deliberate soft equals; if we truncated anything and we prefer unparsed data, use said unparsed data for accuracy's sake
            if (Number.isNaN(parseAttempt) || (preferUnparsed && parseAttempt != e.target.value))
            {
                stats.value[e.target.name] = e.target.value;
                return;
            }

            stats.value[e.target.name] = parseAttempt;
        }


        function sanitizeNumber(e, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY)
        {
            // Remove all letters that might have snuck in, then try to parse
            let sanitized = parseIntFormatted(e.target.value.replace(/[a-z]/gi, ""));

            // If parsing failed, reset input to its last valid value
            if (isNaN(sanitized))
            {
                e.target.value = stats.value[e.target.name]
                return;
            }

            stats.value[e.target.name] = Math.min(Math.max(sanitized, min), max);
        }



        onMounted(() =>
        {
            setTheme(null, currentDisplayMode.value);
        })

        return {
            stats,
            levelStatKey,

            setTheme,
            applyChanges,
            applyParsedChanges,
            sanitizeNumber
        }
    }
}).mount('#app')

