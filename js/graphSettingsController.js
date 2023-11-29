function toggleSettings() {
    const graphSettings = document.getElementById("graph-settings")
    graphSettings.classList.toggle('open')
}

document.getElementById('toggleSettingsBtn').addEventListener('click', toggleSettings)