const registerComponents = (...components) =>
    Promise.all(components.map(registerComponent));

const registerComponent = componentName =>
    fetch(`./templates/${componentName}.html`)
        .then(res => res.text())
        .then(html => new DOMParser().parseFromString(html, 'text/html'))
        .then(doc => doc.querySelector('template'))
        .then(template =>
            customElements.define(
                componentName,
                class extends HTMLElement {
                    constructor() {
                        super();
                        const templateContent = template.content;

                        const shadowRoot = this.attachShadow({ mode: 'open' });
                        shadowRoot.appendChild(templateContent.cloneNode(true));
                    }
                }
            )
        )
        .then(() => customElements.get(componentName));

const createSlot = (tag, slotName = '', addToElement = null) => {
    const slot = document.createElement(tag);
    slot.setAttribute('slot', slotName);
    if (addToElement) {
        addToElement.append(slot);
    }
    return slot;
};

registerComponents('building-settings')