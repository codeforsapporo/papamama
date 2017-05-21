window.FacilityFilter = function () {
};

/**
 * 指定したフィルター条件に一致する施設情報のGeoJsonを生成する
 *
 * @param  {[type]} conditions        [description]
 * @param  {[type]} nurseryFacilities [description]
 * @return {[type]}                   [description]
 */
FacilityFilter.prototype.getFilteredFeaturesGeoJson = function (conditions, nurseryFacilities)
{
    // 絞り込んだ条件に一致する施設を格納するgeoJsonを準備
    var newGeoJson = {
        "type": "FeatureCollection",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features":[]
    };
    // console.log("getFilteredFeaturesGeoJson");

    // 私立認可保育園の検索元データを取得
    var priNinkaFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "私立認可保育所") return true;
        });
    Array.prototype.push.apply(priNinkaFeatures, _features);

    // 公立認可保育園の検索元データを取得
    var pubNinkaFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "公立認可保育所") return true;
        });
    Array.prototype.push.apply(pubNinkaFeatures, _features);

    // 認可外保育園の検索元データを取得
    var ninkagaiFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "認可外保育施設") return true;
        });
    Array.prototype.push.apply(ninkagaiFeatures, _features);

    /* 2017-02 @kakiki ins-st */
    // 横浜保育室の検索元データを取得
    var yhoikuFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "横浜保育室") return true;
        });
    Array.prototype.push.apply(yhoikuFeatures, _features);
    /* 2017-02 @kakiki ins-end */

    // 幼稚園の検索元データを取得
    var youchienFeatures = [];
    _features = nurseryFacilities.features.filter(function (item,idx) {
            var type = item.properties['種別'] ? item.properties['種別'] : item.properties['Type'];
            if(type == "幼稚園") return true;
        });
    Array.prototype.push.apply(youchienFeatures, _features);

    // 小規模保育・事業所内の検索元データを取得
    // 未対応(2017-02現在)

    // ----------------------------------------------------------------------
    // 公立認可保育所向けフィルター(2017-02 kakiki 公立/認可対応)
    // ----------------------------------------------------------------------
    // 公立認可保育所：開園時間  --2017-02 kakiki 開園/終園時間の比較方法を変更
    if(conditions['PubNinkaOpenTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _open = new Date(2010, 0, 1, conditions['PubNinkaOpenTime'], 0, 0);
                var open = item.properties['開園時間'] ? item.properties['開園時間'] : item.properties['Open'];
                //各保育園の開園時間を変換
                open = open.replace("：", ":");  //全角だったら半角に変更
                var hour = open.slice(0, open.indexOf(":"));
                var min = open.slice(-2);
                var open_time = new Date(2010, 0, 1, hour, min, 0);
                if(open !== "" && open_time <= _open) {
                    return true;
                }
            };
            return f(item,idx);
        };
        pubNinkaFeatures = pubNinkaFeatures.filter(filterfunc);
    }
    // 公立認可保育所：終園時間
    if(conditions['PubNinkaCloseTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _close = new Date(2010, 0, 1, conditions['PubNinkaCloseTime'], 0, 0);
                var close = item.properties['終園時間'] ? item.properties['終園時間'] : item.properties['Close'];
                //各保育園の終園時間を変換
                close = close.replace("：", ":");  //全角だったら半角に変更
                var hour = close.slice(0, close.indexOf(":"));
                if(hour !== "" && hour <= 12) {hour = hour + 24};  //終園時間が24時過ぎの場合翌日扱い
                var min = close.slice(-2);
                var close_time = new Date(2010, 0, 1, hour, min, 0);
                if(close_time >= _close) {
                      return true;
                  }
            };
            return f(item,idx);
        };

        pubNinkaFeatures = pubNinkaFeatures.filter(filterfunc);
    }
    /*  元ソース
    // 公立認可保育所：開園時間
    if(conditions['PubNinkaOpenTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _time = conditions['PubNinkaOpenTime'] + ":00";
                var open = item.properties['開園時間'] ? item.properties['開園時間'] : item.properties['Open'];
                if(open == _time) {
                    return true;
                }
            };
            return f(item,idx);
        };
        pubNinkaFeatures = pubNinkaFeatures.filter(filterfunc);
    }
    // 公立認可保育所：終園時間
    if(conditions['PubNinkaCloseTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                switch(conditions['PubNinkaCloseTime']) {
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
                var close = item.properties['終園時間'] ? item.properties['終園時間'] : item.properties['Close'];
                if($.inArray(close, checkAry) >= 0) {
                    return true;
                }
            };
            return f(item,idx);
        };

        pubNinkaFeatures = pubNinkaFeatures.filter(filterfunc);
    }
*/
    // 公立認可保育所：一時
    if(conditions['PubNinkaIchijiHoiku']) {
        filterfunc = function (item,idx) {
            var temp = item.properties['一時'] ? item.properties['一時'] : item.properties['Temp'];
//            if(temp !== null) { //2017-02 kakiki-upd
            if(temp === conditions['PubNinkaIchijiHoiku']) {
                return true;
            }
        };
        pubNinkaFeatures = pubNinkaFeatures.filter(filterfunc);
    }
    // 公立認可保育所：夜間
    if(conditions['PubNinkaYakan']) {
        filterfunc = function (item,idx) {
            var night = item.properties['夜間'] ? item.properties['夜間'] : item.properties['Night'];
//            if(night !== null) { //2017-02 kakiki-upd
            if(night === conditions['PubNinkaYakan']) {
                return true;
            }
        };
        pubNinkaFeatures = pubNinkaFeatures.filter(filterfunc);
    }
    // 公立認可保育所：休日
    if(conditions['PubNinkaKyujitu']) {
        filterfunc = function (item,idx) {
            var holiday = item.properties['休日'] ? item.properties['休日'] : item.properties['Holiday'];
//            if(holiday !== null) { //2017-02 kakiki-upd
            if(holiday === conditions['PubNinkaKyujitu']) {
                return true;
            }
        };
        pubNinkaFeatures = pubNinkaFeatures.filter(filterfunc);
    }
    // 公立認可保育所：空きあり
    if(conditions['PubNinkaVacancy']) {
        filterfunc = function (item,idx) {
            var vacancy = item.properties['Vacancy'] ? item.properties['Vacancy'] : item.properties['Vacancy'];
//            if(vacancy !== null) { //2017-02 kakiki-upd
            if(vacancy === conditions['PubNinkaVacancy']) {
                return true;
            }
        };
        pubNinkaFeatures = pubNinkaFeatures.filter(filterfunc);
    }
    // console.log("[after]ninkaFeatures length:", ninkaFeatures.length);

    // ----------------------------------------------------------------------
    // 私立認可保育所向けフィルター(2017-02 kakiki 公立/私立認可対応)
    // ----------------------------------------------------------------------
    // 私立認可保育所：開園時間  --2017-02 kakiki 開園/終園時間の比較方法を変更
    if(conditions['PriNinkaOpenTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _open = new Date(2010, 0, 1, conditions['PriNinkaOpenTime'], 0, 0);
                var open = item.properties['開園時間'] ? item.properties['開園時間'] : item.properties['Open'];
                //各保育園の開園時間を変換
                open = open.replace("：", ":");  //全角だったら半角に変更
                var hour = open.slice(0, open.indexOf(":"));
                var min = open.slice(-2);
                var open_time = new Date(2010, 0, 1, hour, min, 0);
                if(open !== "" && open_time <= _open) {
                    return true;
                }
            };
            return f(item,idx);
        };
        priNinkaFeatures = priNinkaFeatures.filter(filterfunc);
    }
    // 私立認可保育所：終園時間
    if(conditions['PriNinkaCloseTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _close = new Date(2010, 0, 1, conditions['PriNinkaCloseTime'], 0, 0);
                var close = item.properties['終園時間'] ? item.properties['終園時間'] : item.properties['Close'];
                //各保育園の終園時間を変換
                close = close.replace("：", ":");  //全角だったら半角に変更
                var hour = close.slice(0, close.indexOf(":"));
                if(hour !== "" && hour <= 12) {hour = hour + 24};  //終園時間が24時過ぎの場合翌日扱い
                var min = close.slice(-2);
                var close_time = new Date(2010, 0, 1, hour, min, 0);
                if(close_time >= _close) {
                      return true;
                  }
            };
            return f(item,idx);
        };

        priNinkaFeatures = priNinkaFeatures.filter(filterfunc);
    }

/*
    // 私立認可保育所：開園時間
    // console.log("[before]priNinkaFeatures length:", priNinkaFeatures.length);
    if(conditions['PriNinkaOpenTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _time = conditions['PriNinkaOpenTime'] + ":00";
                var open = item.properties['開園時間'] ? item.properties['開園時間'] : item.properties['Open'];
                if(open == _time) {
                    return true;
                }
            };
            return f(item,idx);
        };
        priNinkaFeatures = priNinkaFeatures.filter(filterfunc);
    }
    // 私立認可保育所：終園時間
    if(conditions['PriNinkaCloseTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                switch(conditions['PriNinkaCloseTime']) {
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
                var close = item.properties['終園時間'] ? item.properties['終園時間'] : item.properties['Close'];
                if($.inArray(close, checkAry) >= 0) {
                    return true;
                }
            };
            return f(item,idx);
        };

        priNinkaFeatures = priNinkaFeatures.filter(filterfunc);
    }
*/
    // 私立認可保育所：一時
    if(conditions['PriNinkaIchijiHoiku']) {
        filterfunc = function (item,idx) {
            var temp = item.properties['一時'] ? item.properties['一時'] : item.properties['Temp'];
//            if(temp !== null) { //2017-02 kakiki-upd
            if(temp === conditions['PriNinkaIchijiHoiku']) {
                return true;
            }
        };
        priNinkaFeatures = priNinkaFeatures.filter(filterfunc);
    }
    // 私立認可保育所：夜間
    if(conditions['PriNinkaYakan']) {
        filterfunc = function (item,idx) {
            var night = item.properties['夜間'] ? item.properties['夜間'] : item.properties['Night'];
//            if(night !== null) { //2017-02 kakiki-upd
            if(night === conditions['PriNinkaYakan']) {
                return true;
            }
        };
        priNinkaFeatures = priNinkaFeatures.filter(filterfunc);
    }
    // 私立認可保育所：休日
    if(conditions['PriNinkaKyujitu']) {
        filterfunc = function (item,idx) {
            var holiday = item.properties['休日'] ? item.properties['休日'] : item.properties['Holiday'];
//            if(holiday !== null) { //2017-02 kakiki-upd
            if(holiday === conditions['PriNinkaKyujitu']) {
                return true;
            }
        };
        priNinkaFeatures = priNinkaFeatures.filter(filterfunc);
    }
    // 私立認可保育所：空きあり
    if(conditions['PriNinkaVacancy']) {
        filterfunc = function (item,idx) {
            var vacancy = item.properties['Vacancy'] ? item.properties['Vacancy'] : item.properties['Vacancy'];
//            if(vacancy !== null) { //2017-02 kakiki-upd
            if(vacancy === conditions['PriNinkaVacancy']) {
                return true;
            }
        };
        priNinkaFeatures = priNinkaFeatures.filter(filterfunc);
    }
    // console.log("[after]ninkaFeatures length:", ninkaFeatures.length);

    // ----------------------------------------------------------------------
    // 認可外保育所向けフィルター
    // ----------------------------------------------------------------------
    // 認可外：開園時間  --2017-02 kakiki 開園/終園時間の比較方法を変更
    if(conditions['ninkagaiOpenTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _open = new Date(2010, 0, 1, conditions['ninkagaiOpenTime'], 0, 0);
                var open = item.properties['開園時間'] ? item.properties['開園時間'] : item.properties['Open'];
                //各保育園の開園時間を変換
                open = open.replace("：", ":");  //全角だったら半角に変更
                var hour = open.slice(0, open.indexOf(":"));
                var min = open.slice(-2);
                var open_time = new Date(2010, 0, 1, hour, min, 0);
                if(open !== "" && open_time <= _open) {
                    return true;
                }
            };
            return f(item,idx);
        };
        ninkagaiFeatures = ninkagaiFeatures.filter(filterfunc);
    }
    // 認可外：終園時間
    if(conditions['ninkagaiCloseTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _close = new Date(2010, 0, 1, conditions['ninkagaiCloseTime'], 0, 0);
                var close = item.properties['終園時間'] ? item.properties['終園時間'] : item.properties['Close'];
                //各保育園の終園時間を変換
                close = close.replace("：", ":");  //全角だったら半角に変更
                var hour = close.slice(0, close.indexOf(":"));
                if(hour !== "" && hour <= 12) {hour = hour + 24};  //終園時間が24時過ぎの場合翌日扱い
                var min = close.slice(-2);
                var close_time = new Date(2010, 0, 1, hour, min, 0);
                if(close_time >= _close) {
                      return true;
                  }
            };
            return f(item,idx);
        };

        ninkagaiFeatures = ninkagaiFeatures.filter(filterfunc);
    }
/*
    // 認可外：開園時間
    // console.log("[before]ninkagaiFeatures length:", ninkagaiFeatures.length);
    if(conditions['ninkagaiOpenTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _time = conditions['ninkagaiOpenTime'];
                var open = item.properties['開園時間'] ? item.properties['開園時間'] : item.properties['Open'];
                if(open == _time) {
                    return true;
                }
            };
            return f(item,idx);
        };
        ninkagaiFeatures = ninkagaiFeatures.filter(filterfunc);
    }
    // 認可外：終園時間
    if(conditions['ninkagaiCloseTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
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
                var h24   = item.properties['H24'] ? item.properties['H24'] : item.properties['H24'];
                var close = item.properties['終園時間'] ? item.properties['終園時間'] : item.properties['Close'];
                if(h24 !== null || $.inArray(close, checkAry) >= 0) {
                    return true;
                }
            };
            return f(item,idx);
        };
        ninkagaiFeatures = ninkagaiFeatures.filter(filterfunc);
    }
*/
    // 認可外保育所：24時間
    if(conditions['ninkagai24H']) {
        filterfunc = function (item,idx) {
            var h24 = item.properties['H24'] ? item.properties['H24'] : item.properties['H24'];
//            if(h24 !== null) { //2017-02 kakiki-upd
            if(h24 === conditions['ninkagai24H']) {
                return true;
            }
        };
        ninkagaiFeatures = ninkagaiFeatures.filter(filterfunc);
    }
    // 認可外保育所：証明あり
    if(conditions['ninkagaiShomei']) {
        filterfunc = function (item,idx) {
            var proof = item.properties['証明'] ? item.properties['証明'] : item.properties['Proof'];
//            if(proof !== null) { //2017-02 kakiki-upd
            if(proof === conditions['ninkagaiShomei']) {
                return true;
            }
        };
        ninkagaiFeatures = ninkagaiFeatures.filter(filterfunc);
    }
    // console.log("[after]ninkagaiFeatures length:", ninkagaiFeatures.length);

    /* 2017-02 @kakiki ins-st */
    // ----------------------------------------------------------------------
    // 横浜保育室向けフィルター
    // ----------------------------------------------------------------------
    // 横浜保育室：開園時間  --2017-02 kakiki 開園/終園時間の比較方法を変更
    if(conditions['YhoikuOpenTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _open = new Date(2010, 0, 1, conditions['YhoikuOpenTime'], 0, 0);
                var open = item.properties['開園時間'] ? item.properties['開園時間'] : item.properties['Open'];
                //各保育園の開園時間を変換
                open = open.replace("：", ":");  //全角だったら半角に変更
                var hour = open.slice(0, open.indexOf(":"));
                var min = open.slice(-2);
                var open_time = new Date(2010, 0, 1, hour, min, 0);
                if(open !== "" && open_time <= _open) {
                    return true;
                }
            };
            return f(item,idx);
        };
        yhoikuFeatures = yhoikuFeatures.filter(filterfunc);
    }
    // 横浜保育室：終園時間
    if(conditions['YhoikuCloseTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _close = new Date(2010, 0, 1, conditions['YhoikuCloseTime'], 0, 0);
                var close = item.properties['終園時間'] ? item.properties['終園時間'] : item.properties['Close'];
                //各保育園の終園時間を変換
                close = close.replace("：", ":");  //全角だったら半角に変更
                var hour = close.slice(0, close.indexOf(":"));
                if(hour !== "" && hour <= 12) {hour = hour + 24};  //終園時間が24時過ぎの場合翌日扱い
                var min = close.slice(-2);
                var close_time = new Date(2010, 0, 1, hour, min, 0);
                if(close_time >= _close) {
                      return true;
                  }
            };
            return f(item,idx);
        };

        yhoikuFeatures = yhoikuFeatures.filter(filterfunc);
    }
/*
    // 横浜保育室：開園時間
    if(conditions['YhoikuOpenTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                var _time = conditions['YhoikuOpenTime'] + ":00";
                var open = item.properties['開園時間'] ? item.properties['開園時間'] : item.properties['Open'];
                if(open == _time) {
                    return true;
                }
            };
            return f(item,idx);
        };
        yhoikuFeatures = yhoikuFeatures.filter(filterfunc);
    }
    // 横浜保育室：終園時間
    if(conditions['YhoikuCloseTime']) {
        filterfunc = function (item, idx) {
            f = function (item,idx) {
                switch(conditions['YhoikuCloseTime']) {
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
                var close = item.properties['終園時間'] ? item.properties['終園時間'] : item.properties['Close'];
                if($.inArray(close, checkAry) >= 0) {
                    return true;
                }
            };
            return f(item,idx);
        };

        yhoikuFeatures = yhoikuFeatures.filter(filterfunc);
    }
*/
    // 横浜保育室：一時
    if(conditions['YhoikuIchijiHoiku']) {
        filterfunc = function (item,idx) {
            var temp = item.properties['一時'] ? item.properties['一時'] : item.properties['Temp'];
//            if(temp !== null) { //2017-02 kakiki-upd
            if(temp === conditions['YhoikuIchijiHoiku']) {
                return true;
            }
        };
        yhoikuFeatures = yhoikuFeatures.filter(filterfunc);
    }
    // 横浜保育室：夜間
    if(conditions['YhoikuYakan']) {
        filterfunc = function (item,idx) {
            var night = item.properties['夜間'] ? item.properties['夜間'] : item.properties['Night'];
//            if(night !== null) { //2017-02 kakiki-upd
            if(night === conditions['YhoikuYakan']) {
                return true;
            }
        };
        yhoikuFeatures = yhoikuFeatures.filter(filterfunc);
    }
    // 横浜保育室：休日
    if(conditions['YhoikuKyujitu']) {
        filterfunc = function (item,idx) {
            var holiday = item.properties['休日'] ? item.properties['休日'] : item.properties['Holiday'];
//            if(holiday !== null) { //2017-02 kakiki-upd
            if(holiday === conditions['YhoikuKyujitu']) {
                return true;
            }
        };
        yhoikuFeatures = yhoikuFeatures.filter(filterfunc);
    }
    // 横浜保育室：空きあり
    if(conditions['YhoikuVacancy']) {
        filterfunc = function (item,idx) {
            var vacancy = item.properties['Vacancy'] ? item.properties['Vacancy'] : item.properties['Vacancy'];
//            if(vacancy !== null) { //2017-02 kakiki-upd
            if(vacancy === conditions['YhoikuVacancy']) {
                return true;
            }
        };
        yhoikuFeatures = yhoikuFeatures.filter(filterfunc);
    }
    /* 2017-02 @kakiki ins-end */

    // ----------------------------------------------------------------------
    // 幼稚園向けフィルター
    // ----------------------------------------------------------------------
    // まだ用意しない

    // 戻り値の作成
    var features = [];
    //Array.prototype.push.apply(features, ninkaFeatures);
    Array.prototype.push.apply(features, priNinkaFeatures);
    Array.prototype.push.apply(features, pubNinkaFeatures);
    Array.prototype.push.apply(features, ninkagaiFeatures);
    Array.prototype.push.apply(features, youchienFeatures);
    Array.prototype.push.apply(features, yhoikuFeatures);   //2017-02 kakiki-ins
    // console.log("getFilteredFeaturesGeoJson: return value: ", features.length);
    newGeoJson.features = features;
    return newGeoJson;
};
