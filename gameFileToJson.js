const fs = require('fs');
const Jomini = require('jomini')
const YAML = require('yaml')
const webp = require("webp-converter");

const vic_path = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Victoria 3\\game\\'

async function gameFilesToObject(path) {
    let data = fs.readFileSync(path, 'utf8');

    const parser = await Jomini.Jomini.initialize()
    const file_json = parser.parseText(data)

    //console.log(file_json)
    // filter useless keys
    const whitelisted_keys = [
        "building_group", "production_method_groups", "always_possible", "parent_group", "lens", "land_usage",
        "capped_by_resources", "production_methods", "building_modifiers", "cost", "texture", "arable_land",
        "arable_resources", "capped_resources", "resource", "traits" , "modifier"
    ]

    for (const [p_key, value] of Object.entries(file_json)) {
        let filtered_json = Object.keys(value).filter(key =>
            whitelisted_keys.includes(key)
        ).reduce((filtered_json, currKey) =>
                (filtered_json[currKey] = value[currKey], filtered_json),
            {});

        file_json[p_key] = filtered_json
    }

    return file_json;
}

async function parse_buildings(){
    let building_paths = ["01_industry", "02_agro", "03_mines", "04_plantations", "05_military", "09_misc_resource"]
    let buildings = {}

    for (const path of building_paths) {
        let new_buildings = await gameFilesToObject(vic_path + 'common\\buildings\\' + path + '.txt')

        buildings = {...buildings, ...new_buildings}
    }

    return buildings
}

async function parse_building_groups(){
    return await gameFilesToObject(vic_path + 'common\\building_groups\\00_building_groups.txt')
}

async function parse_production_method_groups(){
    let pmg_paths = ["01_industry", "02_agro", "03_mines", "04_plantations", "05_military", "09_misc_resource"]
    let production_method_groups = {}

    for (const path of pmg_paths) {
        let new_pmg = await gameFilesToObject(vic_path + 'common\\production_method_groups\\' + path + '.txt')

        production_method_groups = {...production_method_groups, ...new_pmg}
    }

    return production_method_groups
}

async function parse_production_methods(){
    let pm_paths = ["01_industry", "02_agro", "03_mines", "04_plantations", "05_military", "09_misc_resource"]
    let production_methods = {}

    for (const path of pm_paths) {
        let new_pm = await gameFilesToObject(vic_path + 'common\\production_methods\\' + path + '.txt')

        production_methods = {...production_methods, ...new_pm}
    }

    return production_methods
}

async function parse_state_regions(){
    let sr_paths = [
        "00_west_europe", "01_south_europe", "02_east_europe", "03_north_africa", "04_subsaharan_africa",
        "05_north_america", "06_central_america", "07_south_america", "08_middle_east", "09_central_asia",
        "10_india", "11_east_asia", "12_indonesia", "13_australasia", "14_siberia"
    ]
    let state_regions = {}

    for (const path of sr_paths) {
        let new_sr = await gameFilesToObject(vic_path + 'map_data\\state_regions\\' + path + '.txt')

        state_regions = {...state_regions, ...new_sr}
    }

    return state_regions
}

async function parse_state_traits(){
     let st_paths = [
        "00_generic_traits", "01_scandinavia_traits", "02_british_isles_traits", "03_north_america_traits", "04_south_america_traits",
        "05_western_europe_traits", "06_eastern_europe_traits", "07_africa_traits", "08_near_east_traits", "09_india_traits",
        "10_south_east_asia_traits", "11_far_east_asia_traits", "12_oceania_traits"
    ]

    let state_traits = {}

    for (const path of st_paths) {
        let new_st = await gameFilesToObject(vic_path + 'common\\state_traits\\' + path + '.txt')

        state_traits = {...state_traits, ...new_st}
    }

    return state_traits
}



async function main() {
    //region copy game Files, file -> json
    // read buildings
    let buildings = await parse_buildings()

    // read Building groups
    let buildings_groups = await parse_building_groups()

    // read production method groups
    let production_method_groups = await parse_production_method_groups()

    // read production methods
    let production_methods = await parse_production_methods()

    // read goods
    let goods = await gameFilesToObject(vic_path + 'common\\goods\\00_goods.txt')

    // read state regions
    let state_regions = await parse_state_regions()

    // read state traits
    let state_traits = await parse_state_traits()


    // merge
    let game_files_object = {
        "goods": goods,
        "buildings": buildings,
        "production_method_groups": production_method_groups,
        "production_methods": production_methods,
        "state_regions":state_regions,
        "state_traits":state_traits
    }

    //console.log(game_files_object)

    // write json

    let json_string = JSON.stringify(game_files_object)
    fs.writeFile('./game_files.json', json_string, err => {
        if (err) {
            console.error(err);
        }
    });
    //endregion

    //region copy localization, yml -> json
    const localization_files = ["goods_l_german", "production_methods_l_german", "production_methods_2_l_german", "buildings_l_german"]
    const loc_path = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Victoria 3\\game\\localization\\german\\'

    let yaml_object = {'telephones': 'Telefone'}
    for (const file of localization_files) {
        const yml = fs.readFileSync(loc_path+file+'.yml', "utf-8")
        yaml_object = {...yaml_object, ...YAML.parse(yml)["l_german"]}
    }

    const yml_json = JSON.stringify(yaml_object)
    fs.writeFileSync("./localization/german.json", yml_json)
    //endregion

    //region copy icons, dds -> webp


    //endregion
}





main()

