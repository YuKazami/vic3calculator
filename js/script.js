let game_data;
let loc_goods;
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
            loc_goods = data
        })
}

async function fill_cytoscape(cy) {
    // add goods
    for (const good of Object.keys(game_data["goods"])) {
        const name = loc_goods[good] ? loc_goods[good] : good
        const icon_name = game_data["goods"][good]['texture'].split('/').at(-1).replace('.dds', '')

        cy.add({
            group: 'nodes',
            data: {id: good, name: name, icon: './icons/png/' + icon_name + '.png'}
        })
    }

    // add buildings
    for (const building of Object.keys(game_data["buildings"])) {
        const name = loc_goods[building] ? loc_goods[building] : building
        const icon_name = game_data["buildings"][building]['texture'].split('/').at(-1).replace('.dds', '')

        cy.add({
            group: 'nodes',
            data: {id: building, name: name, icon: './icons/png/' + icon_name + '.png'}
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
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
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

async function main() {
    await fetch_files()

    await init_cytoscape()
    // TODO get selected buildings, toggle all, toggle by section(mine/farm/etc)
    // TODO get selected PMs

    let selected_pms = {}

    //region Temp
    for(const building of Object.keys(game_data["buildings"])){
        const pmgs = game_data["buildings"][building]["production_method_groups"]
        let pms = []
        for(const pmg of pmgs){
             pms.push(game_data["production_method_groups"][pmg]["production_methods"][0])
        }
        selected_pms[building] = pms
    }
    selected_pms["building_tooling_workshops"] = ["pm_steel", "pm_automation_disabled", "pm_merchant_guilds_building_tooling_workshops"]
    //delete selected_pms["building_tooling_workshops"]
    //delete selected_pms["building_iron_mine"]

    //endregion

    console.log(selected_pms)


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

main()