window.FacilityFilter = function() {
};

/**
 * 指定したフィルター条件に一致する施設情報のGeoJsonを生成する
 *
 * @param  {[type]} conditions        [description]
 * @param  {[type]} nurseryFacilities [description]
 * @return {[type]}                   [description]
 */
FacilityFilter.prototype.getFilteredFeaturesGeoJson = function(conditions, nurseryFacilities)
{
    // 絞り込んだ条件に一致する施設を格納するgeoJsonを準備
    var newGeoJson = {
        "type": "FeatureCollection",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features":[]
    };
    // console.log("getFilteredFeaturesGeoJson");

    // 認可保育園の検索元データを取得
    var ninkaFeatures = [];
    _features = nurseryFacilities.features.filter(function(item,idx){
            if(item.properties['種別'] == "認可保育所") return true;
        });
    Array.prototype.push.apply(ninkaFeatures, _features);

    // 認可外保育園の検索元データを取得
    var ninkagaiFeatures = [];
    _features = nurseryFacilities.features.filter(function(item,idx){
            if(item.properties['種別'] == "認可外") return true;
        });
    Array.prototype.push.apply(ninkagaiFeatures, _features);

    // 幼稚園の検索元データを取得
    var youchienFeatures = [];
    _features = nurseryFacilities.features.filter(function(item,idx){
            if(item.properties['種別'] == "幼稚園") return true;
        });
    Array.prototype.push.apply(youchienFeatures, _features);

    // ----------------------------------------------------------------------
    // 認可保育所向けフィルター
    // ----------------------------------------------------------------------
    // 認可保育所：開園時間
    // console.log("[before]ninkaFeatures length:", ninkaFeatures.length);
    if(conditions['ninkaOpenTime']) {
        filterfunc = function(item, idx) {
            f = function(item,idx){
                _time = conditions['ninkaOpenTime'] + ":00";
                if(item.properties['開園時間'] == _time) {
                    return true;
                }
            };
            return f(item,idx);
        };
        ninkaFeatures = ninkaFeatures.filter(filterfunc);
    }
    // 認可保育所：終園時間
    if(conditions['ninkaCloseTime']) {
        filterfunc = function(item, idx) {
            f = function(item,idx){
                switch(conditions['ninkaCloseTime']) {
                    case "18":
                        checkAry = ["18:00","19:00","20:00","22:00","0:00"];
                        break;
                    case "19":
                        checkAry = ["19:00","20:00","22:00","0:00"];
                        break;
                    case "20":
                        checkAry = ["20:00","22:00","0:00"];
                        break;
                    case "22":
                        checkAry = ["22:00","0:00"];
                        break;
                    case "24":
                        checkAry = ["0:00"];
                        break;
                }
                if($.inArray(item.properties['終園時間'], checkAry) >= 0) {
                    return true;
                }
            };
            return f(item,idx);
        };

        ninkaFeatures = ninkaFeatures.filter(filterfunc);
    }
    // 認可保育所：一時
    if(conditions['ninkaIchijiHoiku']) {
        filterfunc = function(item,idx){
            if(item.properties['一時'] !== null) {
                return true;
            }
        };
        ninkaFeatures = ninkaFeatures.filter(filterfunc);
    }
    // 認可保育所：夜間
    if(conditions['ninkaYakan']) {
        filterfunc = function(item,idx){
            if(item.properties['夜間'] !== null) {
                return true;
            }
        };
        ninkaFeatures = ninkaFeatures.filter(filterfunc);
    }
    // 認可保育所：休日
    if(conditions['ninkaKyujitu']) {
        filterfunc = function(item,idx){
            if(item.properties['休日'] !== null) {
                return true;
            }
        };
        ninkaFeatures = ninkaFeatures.filter(filterfunc);
    }
    if(conditions['ninkaVacancy']) {
        filterfunc = function(item,idx){
            if(item.properties['Vacancy'] !== null) {
                return true;
            }
        };
        ninkaFeatures = ninkaFeatures.filter(filterfunc);
    }
    // console.log("[after]ninkaFeatures length:", ninkaFeatures.length);

    // ----------------------------------------------------------------------
    // 認可外保育所向けフィルター
    // ----------------------------------------------------------------------
    // 認可外：開園時間
    // console.log("[before]ninkagaiFeatures length:", ninkagaiFeatures.length);
    if(conditions['ninkagaiOpenTime']) {
        filterfunc = function(item, idx) {
            f = function(item,idx){
                _time = conditions['ninkagaiOpenTime'];
                if(item.properties['開園時間'] == _time) {
                    return true;
                }
            };
            return f(item,idx);
        };
        ninkagaiFeatures = ninkagaiFeatures.filter(filterfunc);
    }
    // 認可外：終園時間
    if(conditions['ninkagaiCloseTime']) {
        filterfunc = function(item, idx) {
            f = function(item,idx){
                checkAry = [];
                switch(conditions['ninkagaiCloseTime']) {
                    case "18":
                        checkAry = ["18:00","19:00","19:30","19:45","20:00","20:30","22:00","23:00","3:00"];
                        break;
                    case "19":
                        checkAry = ["19:00","19:30","19:45","20:00","20:30","22:00","23:00","3:00"];
                        break;
                    case "20":
                        checkAry = ["20:00","20:30","22:00","23:00","3:00"];
                        break;
                    case "22":
                        checkAry = ["22:00","23:00","3:00"];
                        break;
                    case "27":
                        checkAry = ["3:00"];
                        break;
                }
                if(item.properties['H24'] !== null || $.inArray(item.properties['終園時間'], checkAry) >= 0) {
                    return true;
                }
            };
            return f(item,idx);
        };
        ninkagaiFeatures = ninkagaiFeatures.filter(filterfunc);
    }
    // 認可保育所：24時間
    if(conditions['ninkagai24H']) {
        filterfunc = function(item,idx){
            if(item.properties['H24'] !== null) {
                return true;
            }
        };
        ninkagaiFeatures = ninkagaiFeatures.filter(filterfunc);
    }
    // 認可保育所：証明あり
    if(conditions['ninkagaiShomei']) {
        filterfunc = function(item,idx){
            if(item.properties['証明'] !== null) {
                return true;
            }
        };
        ninkagaiFeatures = ninkagaiFeatures.filter(filterfunc);
    }
    // console.log("[after]ninkagaiFeatures length:", ninkagaiFeatures.length);

    // ----------------------------------------------------------------------
    // 幼稚園向けフィルター
    // ----------------------------------------------------------------------
    // まだ用意しない

    // 戻り値の作成
    var features = [];
    Array.prototype.push.apply(features, ninkaFeatures);
    Array.prototype.push.apply(features, ninkagaiFeatures);
    Array.prototype.push.apply(features, youchienFeatures);
    // console.log("getFilteredFeaturesGeoJson: return value: ", features.length);
    newGeoJson.features = features;
    return newGeoJson;
};
