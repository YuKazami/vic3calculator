let game_data;
let localization_data;
let cy;
let selected_pms = {};

const paradoxIconsPath = "./images/paradox/gfx/interface/icons/"

async function fetch_files() {
    await fetch("game_files.json")
        .then(response => response.json())
        .then(data => {
            game_data = data
        })

    await fetch("localization/german.json")
        .then(response => response.json())
        .then(data => {
            localization_data = data
        })
}

async function fill_cytoscape(cy) {
    // add goods
    for (const good of Object.keys(game_data["goods"])) {
        const name = getLocalized(good) ? getLocalized(good) : good
        const icon_name = game_data["goods"][good]['texture'].split('/').at(-1).replace('.dds', '')

        cy.add({
            group: 'nodes',
            data: {id: good, name: name, icon: paradoxIconsPath + 'goods_icons/' + icon_name + '.png'}
        })
    }

    // add buildings
    for (const building of Object.keys(game_data["buildings"])) {
        const name = getLocalized(building) ? getLocalized(building) : building
        const icon_name = game_data["buildings"][building]['texture'].split('/').at(-1).replace('.dds', '')

        cy.add({
            group: 'nodes',
            data: {id: building, name: name, icon: paradoxIconsPath + 'building_icons/' + icon_name + '.png'}
        })
    }
}

async function init_cytoscape() {
    cy = cytoscape({
        container: document.getElementById('cy'), // container to render in

        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    'label': 'data(name)',
                    'background-opacity': 0,
                    'background-image': 'data(icon)',
                    'background-width': '32px',
                    'background-height': '32px'
                }
            }, {
                selector: 'edge',
                style: {
                    'label': 'data(name)',
                    'width': 3,
                    'line-color': 'goldenrod',
                    'target-arrow-color': 'goldenrod',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            }
        ],

        layout: {
            name: 'grid',
            rows: 1
        }

    });

    await fill_cytoscape(cy)
}

async function refresh_edges() {
    for (const [building_key, building_val] of Object.entries(selected_pms)) {
        let inputs = {}
        let outputs = {}

        for (const pm of building_val) {
            if (!pm) continue;
            if (!game_data["production_methods"][pm]["building_modifiers"]) continue;
            if (!game_data["production_methods"][pm]["building_modifiers"]["workforce_scaled"]) continue;

            const in_out_obj = game_data["production_methods"][pm]["building_modifiers"]["workforce_scaled"]
            for (const [io_key, io_val] of Object.entries(in_out_obj)) {
                const io_key_array = io_key.split("_")
                const io_type = io_key_array[1]
                const io_name = io_key_array.slice(2, -1).join('_')

                if (io_type === "input") {
                    if (inputs[io_name]) {
                        inputs[io_name] += io_val
                    } else {
                        inputs[io_name] = io_val
                    }
                } else {
                    if (outputs[io_name]) {
                        outputs[io_name] += io_val
                    } else {
                        outputs[io_name] = io_val
                    }
                }
            }
        }

        // draw edges
        for (const [i_key, i_val] of Object.entries(inputs)) {
            const cost = game_data["goods"][i_key]["cost"]

            const worth = cost ? i_val * cost + '£' : 0
            cy.add({
                group: 'edges',
                data: {source: i_key, target: building_key, name: worth}
            })
        }

        for (const [o_key, o_val] of Object.entries(outputs)) {
            const cost = game_data["goods"][o_key]["cost"]

            const worth = cost ? o_val * cost + '£' : 0
            cy.add({
                group: 'edges',
                data: {source: building_key, target: o_key, name: worth}
            })
        }
    }
}

async function remove_isolated_nodes() {
    cy.nodes().each(node => {
        if (node.connectedEdges().length === 0) {
            cy.remove(node)
        }
    })
}

async function graph_controller() {
    await init_cytoscape()
    // TODO get selected buildings, toggle all, toggle by section(mine/farm/etc)
    // TODO get selected PMs


    //console.log(selected_pms)


    await refresh_edges()

    // filter lonely nodes
    await remove_isolated_nodes()

    cy.layout({
        name: 'elk',
        nodeDimensionsIncludeLabels: true,
        fit: true,
        ranker: 'longest_path',
        elk: {
            "elk.layered.spacing.nodeNodeBetweenLayers": 128,
            "elk.layered.spacing.nodeNode": 512,
            "elk.direction": 'RIGHT',
            "elk.algorithm": "layered",
            "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
            "elk.edgeRouting": "ORTHOGONAL",
            spacing: 512,
            inLayerSpacingFactor: 50,
            layoutHierarchy: true,
            intCoordinates: true,
            zoomToFit: true,
            separateConnectedComponents: false
        }
    }).run()
}

function getLocalized(word) {
    let localized = localization_data[word]
    if (!localized) {
        return word
    }

    if (localized.includes('$')) {
        localized = localization_data[localized.replaceAll('$', '')]
    }

    return localized
}

async function main() {
    await fetch_files()

    //region Temp
    let selected_buildings = ["building_food_industry", "building_textile_mills", "building_tooling_workshops", "building_paper_mills"]
    selected_buildings = Object.keys(game_data["buildings"])
    for (const building of selected_buildings) {
        const pmgs = game_data["buildings"][building]["production_method_groups"]
        let pms = []
        for (const pmg of pmgs) {
            pms.push(game_data["production_method_groups"][pmg]["production_methods"][0])
        }
        selected_pms[building] = pms
    }

    //endregion

    await graph_controller()

    //neues Zeug
    const graph_setting = document.getElementById('graph-settings-body')
    for (const [building, value] of Object.entries(game_data["buildings"])) {
        const building_element = document.createElement('building-settings')
        building_element.dataset.buildingKey = building

        const buildingNameSlot = createSlot('span', 'buildingName', building_element);
        buildingNameSlot.innerText = getLocalized(building)

        const buildingIconSlot = createSlot('div', 'buildingIcon', building_element)
        const buildingIconInputElement = document.createElement('input')
        buildingIconInputElement.id = 'checkbox_' + building
        buildingIconInputElement.type = 'checkbox'
        buildingIconInputElement.checked = true
        buildingIconInputElement.classList.add('building-icon-checkbox')

        const buildingIconLabelElement = document.createElement('label')
        buildingIconLabelElement.setAttribute('for', buildingIconInputElement.id)

        const buildingIconImgElement = document.createElement('img')
        const icon_name = game_data["buildings"][building]['texture'].split('/').at(-1).replace('.dds', '.png')
        buildingIconImgElement.src = paradoxIconsPath + 'building_icons/' + icon_name

        buildingIconLabelElement.append(buildingIconImgElement)
        buildingIconSlot.append(buildingIconInputElement, buildingIconLabelElement)

        // TODO Inputs Outputs


        const buildingPmgsElement = building_element.shadowRoot.getElementById('buildingPmgs')
        const pmgs = value['production_method_groups']

        for (const pmg of pmgs) {
            const pmg_loc_name = getLocalized(pmg)
            const pmgElement = document.createElement('pmg-choicebox')
            const pmgPmsElement = pmgElement.shadowRoot.getElementById('pmgPms')

            const pmgNameSlot = createSlot('span', 'pmgName', pmgElement)
            pmgNameSlot.innerText = pmg_loc_name

            const pms = game_data['production_method_groups'][pmg]['production_methods']
            let first = true
            for (const pm of pms) {
                const pm_loc_name = getLocalized(pm)
                const pmButtonElement = document.createElement('input')
                pmButtonElement.name = pmg
                pmButtonElement.type = 'radio'
                pmButtonElement.id = 'radio_button_' + pm
                pmButtonElement.classList.add('pm-radio-button')
                //pmButtonElement.dataset.buildingKey = building
                //pmButtonElement.dataset.pmgKey = pmg
                pmButtonElement.dataset.pmKey = pm

                const pmLabelElement = document.createElement('label')
                pmLabelElement.setAttribute('for', pmButtonElement.id)

                const pmImgElement = document.createElement('img')
                const icon_name = game_data["production_methods"][pm]['texture'].split('/').at(-1).replace('.dds', '')
                pmImgElement.src = paradoxIconsPath + 'production_method_icons/' + icon_name + '.png'

                pmLabelElement.append(pmImgElement)

                if (first) {
                    pmButtonElement.checked = true
                    first = false
                }

                pmgPmsElement.append(pmButtonElement, pmLabelElement)
            }
            buildingPmgsElement.append(pmgElement)
        }
        graph_setting.append(building_element, document.createElement('br'), document.createElement('br'))
    }

    graph_setting.addEventListener('click', clickTest)
}

main()

function clickTest(event) {
    const targetElement = event.composedPath()[0]

    if (targetElement.classList.contains('building-icon-checkbox')) {
        const checked = targetElement.checked
        const buildingElement = event.composedPath()[5]
        const new_selected_pms = readBuildingElement(buildingElement)
        if (checked) {
            selected_pms[new_selected_pms[0]] = new_selected_pms[1]
        } else {
            delete selected_pms[new_selected_pms[0]]
        }
        refresh_graph()

    } else if (targetElement.classList.contains('pm-radio-button')) {
        const buildingElement = event.composedPath()[8]
        const new_selected_pms = readBuildingElement(buildingElement)
        selected_pms[new_selected_pms[0]] = new_selected_pms[1]
        refresh_graph()

    } else {
        return;
    }
}

function readBuildingElement(buildingElement) {
    let buildingKey = buildingElement.dataset.buildingKey;
    let pmList = [];
    const buildingPmgsElement = buildingElement.shadowRoot.lastElementChild.lastElementChild

    for (const pmg of Array.from(buildingPmgsElement.children)) {
        for (const pm of Array.from(pmg.shadowRoot.lastElementChild.lastElementChild.children)) {
            if (pm.type !== 'radio') continue;
            if (!pm.checked) continue;
            pmList.push(pm.dataset.pmKey)
        }
    }

    return [buildingKey, pmList]
}

async function refresh_graph() {
    await graph_controller()
}