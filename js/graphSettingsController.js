/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */
function openNav() {
    document.getElementById("graph-settings").style.width = 'unset';

    document.getElementById("graph-settings").style.padding = "1%";
    document.getElementById("main").style.marginLeft = "250px";
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
function closeNav() {
    document.getElementById("graph-settings").style.width = "0";
    document.getElementById("graph-settings").style.padding = "0";
    document.getElementById("main").style.marginLeft = "0";
}

function toggleSettings() {
    const graphSettings = document.getElementById("graph-settings")
    graphSettings.classList.toggle('open')
}

document.getElementById('toggleSettingsBtn').addEventListener('click', toggleSettings)