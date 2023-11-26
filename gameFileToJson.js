const fs = require('fs');
const Jomini = require('jomini')
const YAML = require('yaml')
const webp = require("webp-converter");

const vic_path = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Victoria 3\\game\\common\\'

async function gameFilesToObject(path) {
    let data = fs.readFileSync(vic_path + path, 'utf8');

    const parser = await Jomini.Jomini.initialize()
    const file_json = parser.parseText(data)

    //console.log(file_json)
    // filter useless keys
    const whitelisted_keys = [
        "building_group", "production_method_groups", "always_possible", "parent_group", "lens", "land_usage", "capped_by_resources", "production_methods", "building_modifiers", "cost", "texture"
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

async function main() {
    //region copy game Files, file -> json
    // read buildings
    let building_paths = ["01_industry", "02_agro", "03_mines", "04_plantations", "05_military", "09_misc_resource"]
    let buildings = {}

    for (const path of building_paths) {
        let new_buildings = await gameFilesToObject('buildings\\' + path + '.txt')

        buildings = {...buildings, ...new_buildings}
    }

    // read Building groups
    let buildings_groups = await gameFilesToObject('building_groups\\00_building_groups.txt')

    // read production method groups
    let pmg_paths = ["01_industry", "02_agro", "03_mines", "04_plantations", "05_military", "09_misc_resource"]
    let production_method_groups = {}

    for (const path of pmg_paths) {
        let new_pmg = await gameFilesToObject('production_method_groups\\' + path + '.txt')

        production_method_groups = {...production_method_groups, ...new_pmg}
    }

    // read production methods
    let pm_paths = ["01_industry", "02_agro", "03_mines", "04_plantations", "05_military", "09_misc_resource"]
    let production_methods = {}

    for (const path of pm_paths) {
        let new_pm = await gameFilesToObject('production_methods\\' + path + '.txt')

        production_methods = {...production_methods, ...new_pm}
    }

    // read goods
    let goods = await gameFilesToObject('goods\\00_goods.txt')

    // add icon_urls to goods
    /*const icon_urls = {
        "clothes": "https://vic3.paradoxwikis.com/images/thumb/d/dc/Goods_clothes.png/240px-Goods_clothes.png",
        "fabric": "https://vic3.paradoxwikis.com/images/thumb/c/c0/Goods_fabric.png/240px-Goods_fabric.png",
        "fish": "https://vic3.paradoxwikis.com/images/thumb/4/48/Goods_fish.png/240px-Goods_fish.png",
        "furniture": "https://vic3.paradoxwikis.com/images/thumb/6/6b/Goods_furniture.png/240px-Goods_furniture.png",
        "grain": "https://vic3.paradoxwikis.com/images/thumb/0/05/Goods_grain.png/240px-Goods_grain.png",
        "groceries": "https://vic3.paradoxwikis.com/images/thumb/e/ee/Goods_groceries.png/240px-Goods_groceries.png",
        "paper": "https://vic3.paradoxwikis.com/images/thumb/c/cc/Goods_paper.png/240px-Goods_paper.png",
        "wood": "https://vic3.paradoxwikis.com/images/thumb/6/6f/Goods_wood.png/240px-Goods_wood.png",
        "electricity": "https://vic3.paradoxwikis.com/images/thumb/3/31/Goods_electricity.png/240px-Goods_electricity.png",
        "services": "https://vic3.paradoxwikis.com/images/thumb/f/fe/Goods_services.png/240px-Goods_services.png",
        "transportation": "https://vic3.paradoxwikis.com/images/thumb/e/e3/Goods_transportation.png/240px-Goods_transportation.png",
        "automobiles": "https://vic3.paradoxwikis.com/images/thumb/3/30/Goods_automobiles.png/240px-Goods_automobiles.png",
        "coffee": "https://vic3.paradoxwikis.com/images/thumb/5/53/Goods_coffee.png/240px-Goods_coffee.png",
        "fine_art": "https://vic3.paradoxwikis.com/images/thumb/1/1f/Goods_fine_art.png/240px-Goods_fine_art.png",
        "fruit": "https://vic3.paradoxwikis.com/images/thumb/3/38/Goods_fruit.png/240px-Goods_fruit.png",
        "gold": "https://vic3.paradoxwikis.com/images/thumb/b/b7/Goods_gold.png/240px-Goods_gold.png",
        "liquor": "https://vic3.paradoxwikis.com/images/thumb/7/7e/Goods_liquor.png/240px-Goods_liquor.png",
        "luxury_clothes": "https://vic3.paradoxwikis.com/images/thumb/9/99/Goods_luxury_clothes.png/240px-Goods_luxury_clothes.png",
        "luxury_furniture": "https://vic3.paradoxwikis.com/images/thumb/0/07/Goods_luxury_furniture.png/240px-Goods_luxury_furniture.png",
        "meat": "https://vic3.paradoxwikis.com/images/thumb/6/60/Goods_meat.png/240px-Goods_meat.png",
        "opium": "https://vic3.paradoxwikis.com/images/thumb/6/6c/Goods_opium.png/240px-Goods_opium.png",
        "porcelain": "https://vic3.paradoxwikis.com/images/thumb/c/cf/Goods_porcelain.png/240px-Goods_porcelain.png",
        "radios": "https://vic3.paradoxwikis.com/images/thumb/f/f1/Goods_radios.png/240px-Goods_radios.png",
        "sugar": "https://vic3.paradoxwikis.com/images/thumb/2/2b/Goods_sugar.png/240px-Goods_sugar.png",
        "tea": "https://vic3.paradoxwikis.com/images/thumb/7/70/Goods_tea.png/240px-Goods_tea.png",
        "telephones": "https://vic3.paradoxwikis.com/images/thumb/9/9b/Goods_telephones.png/240px-Goods_telephones.png",
        "tobacco": "https://vic3.paradoxwikis.com/images/thumb/c/cd/Goods_tobacco.png/240px-Goods_tobacco.png",
        "wine": "https://vic3.paradoxwikis.com/images/thumb/a/ad/Goods_wine.png/240px-Goods_wine.png",
        "clippers": "https://vic3.paradoxwikis.com/images/thumb/3/30/Goods_clippers.png/240px-Goods_clippers.png",
        "coal": "https://vic3.paradoxwikis.com/images/thumb/4/45/Goods_coal.png/240px-Goods_coal.png",
        "dye": "https://vic3.paradoxwikis.com/images/thumb/0/07/Goods_dye.png/240px-Goods_dye.png",
        "engines": "https://vic3.paradoxwikis.com/images/thumb/e/eb/Goods_locomotives.png/240px-Goods_locomotives.png",
        "explosives": "https://vic3.paradoxwikis.com/images/thumb/b/b3/Goods_explosives.png/240px-Goods_explosives.png",
        "fertilizer": "https://vic3.paradoxwikis.com/images/thumb/6/64/Goods_fertilizer.png/240px-Goods_fertilizer.png",
        "glass": "https://vic3.paradoxwikis.com/images/thumb/4/46/Goods_glass.png/240px-Goods_glass.png",
        "hardwood": "https://vic3.paradoxwikis.com/images/thumb/d/dd/Goods_hardwood.png/240px-Goods_hardwood.png",
        "iron": "https://vic3.paradoxwikis.com/images/thumb/2/2c/Goods_iron.png/240px-Goods_iron.png",
        "lead": "https://vic3.paradoxwikis.com/images/thumb/4/42/Goods_lead.png/240px-Goods_lead.png",
        "oil": "https://vic3.paradoxwikis.com/images/thumb/8/83/Goods_oil.png/240px-Goods_oil.png",
        "rubber": "https://vic3.paradoxwikis.com/images/thumb/b/b5/Goods_rubber.png/240px-Goods_rubber.png",
        "silk": "https://vic3.paradoxwikis.com/images/thumb/f/f7/Goods_silk.png/240px-Goods_silk.png",
        "steamers": "https://vic3.paradoxwikis.com/images/thumb/3/31/Goods_steamers.png/240px-Goods_steamers.png",
        "steel": "https://vic3.paradoxwikis.com/images/thumb/3/3b/Goods_steel.png/240px-Goods_steel.png",
        "sulfur": "https://vic3.paradoxwikis.com/images/thumb/b/be/Goods_sulfur.png/240px-Goods_sulfur.png",
        "tools": "https://vic3.paradoxwikis.com/images/thumb/7/76/Goods_tools.png/240px-Goods_tools.png",
        "aeroplanes": "https://vic3.paradoxwikis.com/images/thumb/a/a8/Goods_aeroplanes.png/240px-Goods_aeroplanes.png",
        "ammunition": "https://vic3.paradoxwikis.com/images/thumb/1/12/Goods_ammunition.png/240px-Goods_ammunition.png",
        "artillery": "https://vic3.paradoxwikis.com/images/thumb/b/b4/Goods_artillery.png/240px-Goods_artillery.png",
        "ironclads": "https://vic3.paradoxwikis.com/images/thumb/f/fc/Goods_ironclads.png/240px-Goods_ironclads.png",
        "manowars": "https://vic3.paradoxwikis.com/images/thumb/8/85/Goods_man_o_wars.png/240px-Goods_man_o_wars.png",
        "small_arms": "https://vic3.paradoxwikis.com/images/thumb/e/e8/Goods_small_arms.png/240px-Goods_small_arms.png",
        "tanks": "https://vic3.paradoxwikis.com/images/thumb/e/e7/Goods_tanks.png/240px-Goods_tanks.png"
    }
    for (const key of Object.keys(goods)) {
        goods[key]["icon_url"] = icon_urls[key]
    }*/

    //console.log(buildings)
    //console.log(buildings_groups)
    //console.log(production_method_groups)
    //console.log(production_methods)
    //console.log(goods)

    // merge
    let game_files_object = {
        "goods": goods,
        "buildings": buildings,
        "production_method_groups": production_method_groups,
        "production_methods": production_methods
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

