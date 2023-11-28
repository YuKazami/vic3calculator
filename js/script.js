let game_data;
let localization_data;
let cy;

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
            data: {id: good, name: name, icon: './images/icons/png/' + icon_name + '.png'}
        })
    }

    // add buildings
    for (const building of Object.keys(game_data["buildings"])) {
        const name = getLocalized(building) ? getLocalized(building) : building
        const icon_name = game_data["buildings"][building]['texture'].split('/').at(-1).replace('.dds', '')

        cy.add({
            group: 'nodes',
            data: {id: building, name: name, icon: './images/icons/png/' + icon_name + '.png'}
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

async function refresh_edges(selected_pms) {
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

            const worth = cost ? i_val*cost+'£' : 0
            cy.add({
                group: 'edges',
                data: {source: i_key, target: building_key, name: worth}
            })
        }

        for (const [o_key, o_val] of Object.entries(outputs)) {
            const cost = game_data["goods"][o_key]["cost"]

            const worth = cost ? o_val*cost+'£' : 0
            cy.add({
                group: 'edges',
                data: {source: building_key, target: o_key, name: worth}
            })
        }
    }
}

async function remove_isolated_nodes(){
    cy.nodes().each(node => {
        if(node.connectedEdges().length === 0){
            cy.remove(node)
        }
    })
}

async function graph_controller() {
    await init_cytoscape()
    // TODO get selected buildings, toggle all, toggle by section(mine/farm/etc)
    // TODO get selected PMs

    let selected_pms = {}

    //region Temp
    let selected_buildings = ["building_food_industry", "building_textile_mills", "building_tooling_workshops", "building_paper_mills"]
    selected_buildings = Object.keys(game_data["buildings"])
    for(const building of selected_buildings){
        const pmgs = game_data["buildings"][building]["production_method_groups"]
        let pms = []
        for(const pmg of pmgs){
             pms.push(game_data["production_method_groups"][pmg]["production_methods"][0])
        }
        selected_pms[building] = pms
    }
    //selected_pms["building_food_industry"] = ["pm_baking_powder", "pm_cannery", "pm_pot_stills"]
    //selected_pms["building_textile_mills"] = []
    //selected_pms["building_tooling_workshops"] = ["pm_steel", "pm_automation_disabled", "pm_merchant_guilds_building_tooling_workshops"]
    //selected_pms["building_paper_mills"] = ["pm_bleached_paper"]
    //delete selected_pms["building_tooling_workshops"]
    //delete selected_pms["building_iron_mine"]

    //endregion

    //console.log(selected_pms)


    await refresh_edges(selected_pms)

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

function getLocalized(word){
    let localized = localization_data[word]
    if (!localized) {
        return word
    }

    if(localized.includes('$')){
        localized = localization_data[localized.replaceAll('$', '')]
    }

    return localized
}

async function main(){
    await fetch_files()

    await graph_controller()

    //neues Zeug
    const graph_setting = document.getElementById('graph-settings-body')
    for(const [building, value] of Object.entries(game_data["buildings"])){
        const building_element = document.createElement('building-settings')
        const buildingNameSlot = createSlot('span', 'buildingName', building_element);
        buildingNameSlot.innerText = getLocalized(building)


        // TODO: load into name slot
        //building_element.shadowRoot.append()

        const building_pmgs_element = building_element.shadowRoot.getElementById('building-pmgs')
        const pmgs = value['production_method_groups']

        for(const pmg of pmgs){
            const pmg_loc_name = getLocalized(pmg)
            const pmg_choicebox_element = document.createElement('pmg-choicebox')
            const pms = game_data['production_method_groups'][pmg]['production_methods']
            for(const pm of pms){
                const pm_loc_name = getLocalized(pm)
                pmg_choicebox_element.shadowRoot.append(pm_loc_name, ' ')
            }

            building_pmgs_element.append(pmg_choicebox_element, ' ')
        }

        graph_setting.append(building_element, document.createElement('br'), document.createElement('br'))
    }
}
main()