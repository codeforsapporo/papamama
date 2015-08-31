// 地図表示時の中心座標
var init_center_coords = [43.063968, 141.347899];

// Bing APIのキー
var bing_api_key = 'AhGQykUKW2-u1PwVjLwQkSA_1rCTFESEC7bCZ0MBrnzVbVy7KBHsmLgwW_iRJg17';

// Leaflet - Bing
var bingRoadLayer = null;
if (L.BingLayer) {
    bingRoadLayer = new L.BingLayer(bing_api_key, {type: 'Road'});
}
// Leaflet - 国土地理院
var gsiLayer = L.tileLayer('http://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
    attribution: "<a href='http://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html' target='_blank'>国土地理院</a>"
});
// Leaflet - OSM交通
var osmLayer = L.tileLayer('http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
});
// Leaflet - Bing(写真)
var bingAerialLayer = null;
if (L.BingLayer) {
    bingAerialLayer = new L.BingLayer(bing_api_key, {type: 'Aerial'});
}
// Leaflet Google
var googleLayer = null;
if (L.Google) {
    googleLayer = new L.Google('ROADMAP');
}

// map
var map;

// 中心座標変更セレクトボックス用データ
var moveToList = {};

var facilities = [];

/**
 * 初期処理
 */
$(document).ready(function(){
    resizeMapDiv();

    // 地図レイヤー一覧
    var baseMaps = {
        "Bing(標準)": bingRoadLayer,
        "国土地理院": gsiLayer,
        "交通": osmLayer,
        "写真": bingAerialLayer,
        "Google": googleLayer
    };

    // 地図生成
    map = L.map('map', {
        center: init_center_coords,
        zoom: 14,
        minZoom: 12,
        maxZoom: 17,
        layers: [bingRoadLayer]
    });

    // leaflet-hash
    hash = new L.Hash(map);

    // 現在地移動
    L.control.locate().addTo(map);

    L.control.aboutCfS().addTo(map);

    // 施設情報読み込み
    var facilityGroup1 = L.layerGroup();
    var facilityGroup2 = L.layerGroup();
    var facilityGroup3 = L.layerGroup();
    var middleSchool   = L.layerGroup();
    var elementary     = L.layerGroup();

    // geoJson 読み込み
    $.when(
        $.getJSON('data/nurseryFacilities.geojson'),
        $.getJSON('data/MiddleSchool.geojson'),
        $.getJSON('data/MiddleSchool_loc.geojson'),
        $.getJSON('data/Elementary.geojson'),
        $.getJSON('data/Elementary_loc.geojson')
    ).done(function(facilityJson, middleSchoolJson, middleSchoolLocJson, elementaryJson, elementaryLocJson) {
        // 認可保育園
        facilityGroup1 = L.geoJson(facilityJson, {
            onEachFeature: onEachFeatureFunc,
            pointToLayer: pointToLayerFunc,
            filter: facilityGroup1Filter
        });

        // 認可外保育園
        facilityGroup2 = L.geoJson(facilityJson, {
            onEachFeature: onEachFeatureFunc,
            pointToLayer: pointToLayerFunc,
            filter: facilityGroup2Filter
        });

        // 幼稚園
        facilityGroup3 = L.geoJson(facilityJson, {
            onEachFeature: onEachFeatureFunc,
            pointToLayer: pointToLayerFunc,
            filter: facilityGroup3Filter
        });

        // 中学校区ベクター
        var middleSchoolBg = L.geoJson(middleSchoolJson, {
            onEachFeature: function(feature,layer) {
            },
            style: function(feature) {
                return {
                    color: '#7379AE',
                    weight: '2px'
                };
            },
            filter: schoolGroupFilter
        });

        // 中学校区アイコン
        var middleSchoolLoc = L.geoJson(middleSchoolLocJson, {
            onEachFeature: function(feature,layer) {
            },
            pointToLayer: midSchoolPointToLayerFunc,
            filter: schoolGroupFilter
        });

        // ベクターとマーカーを合成したレイヤーグループを作成
        middleSchool = L.layerGroup([middleSchoolBg, middleSchoolLoc]);

        // 小学校区ベクター
        var elementaryBg = L.geoJson(elementaryJson, {
            onEachFeature: function(feature,layer) {
            },
            style: function(feature) {
                return {
                    color: '#1BA466',
                    weight: '2px'
                };
            },
            filter: schoolGroupFilter
        });
        // 小学校区アイコン
        var elementaryLoc = L.geoJson(elementaryLocJson, {
            onEachFeature: function(feature,layer) {
            },
            pointToLayer: elementarySchoolPointToLayerFunc,
            filter: schoolGroupFilter
        });
        // ベクターとマーカーを合成したレイヤーグループを作成
        elementary = L.layerGroup([elementaryBg, elementaryLoc]);


        // 各施設レイヤーを地図に追加
        map.addLayer(facilityGroup1);

        var overlayMaps = {
            '保育園': facilityGroup1,
            '認可外': facilityGroup2,
            '幼稚園': facilityGroup3,
            '小学校区': elementary,
            '中学校区': middleSchool
        };

        // 地図上にチェックボックス
        var chkBoxOption = {
            layers: overlayMaps
        };
        L.control.facilityLayerChkbox(chkBoxOption).addTo(map);

        // レイヤーコントロールを設定
        L.control.layers(baseMaps).addTo(map);

        // 縮尺変更後に発生させるイベントを設定
        map.on('zoomend', showMarkerLabel);

        // 地図ドラッグ後に発生させるイベントを設定
        map.on('moveend', showMarkerLabel);
    });

});

/**
 * デバイス回転時、地図の大きさを画面全体に広げる
 * @return {[type]} [description]
 */
function resizeMapDiv() {
    var screenHeight = $(window).height();
    var contentCurrentHeight = $(".ui-content").outerHeight() - $(".ui-content").height();
    var contentHeight = screenHeight - contentCurrentHeight;
    var navHeight = $("#nav1").outerHeight();
    $(".ui-content").height(contentHeight);
    $("#map").height(contentHeight - navHeight);
}

/**
 * アイコン定義
 */
function pointToLayerFunc(feature, latlng) {

    var iconSize = [25, 25];
    var shadowSize = [35, 35];

    var iconUrl = '';
    var shadowUrl = '';
    if(facilityGroup1Filter(feature, null)) {
        iconUrl   = 'image/019.png';
        shadowUrl = 'image/019_bg.png';
    } else if(facilityGroup2Filter(feature, null)) {
        iconUrl  = 'image/018.png';
        shadowUrl = 'image/018_bg.png';
    } else if(facilityGroup3Filter(feature, null)) {
        iconUrl  = 'image/029.png';
        shadowUrl = 'image/029_bg.png';
    }

    var facIcon = L.icon({
        iconUrl : iconUrl,
        shadowUrl: shadowUrl,
        iconSize: iconSize, // size of the icon
        shadowSize: shadowSize
    });

    // アイコン部ラベル定義
    var featureName = feature.properties.Label;
    var marker = L.marker(latlng, { icon: facIcon }).bindLabel(featureName);
    return marker;
}

/**
 * 中学校学区用
 */
function midSchoolPointToLayerFunc(feature, latlng) {
    return schoolPointToLayer(feature, latlng, 'image/middleSchool_bg.png');
}

/**
 * 中学校学区用
 */
function elementarySchoolPointToLayerFunc(feature, latlng) {
    return schoolPointToLayer(feature, latlng, 'image/elementary_bg.png');
}

/**
 * 学区共通
 */
function schoolPointToLayer(feature, latlng, shadowUrl) {
    var iconSize = [25, 25];
    var shadowSize = [35, 35];

    var iconUrl = 'image/school.png';
    var facIcon = L.icon({
        iconUrl : iconUrl,
        shadowUrl: shadowUrl,
        iconSize: iconSize, // size of the icon
        shadowSize: shadowSize
    });

    // アイコン部ラベル定義
    var featureName = feature.properties.A32_003;
    if(feature.properties.A32_003 === undefined) {
        featureName = feature.properties.A27_007;
    }
    var marker = L.marker(latlng, { icon: facIcon }).bindLabel(featureName);
    return marker;
}

/**
 * 学区用フィルター
 */
function schoolGroupFilter(feature, layer) {
    return true;
}

/**
 * GeoJson読み込み時、認可保育所を絞り込むフィルター関数
 */
function facilityGroup1Filter(feature, layer) {
    if(feature.properties.Type == '認可保育所') {
        return true;
    } else {
        return false;
    }
}

/**
 * GeoJson読み込み時、認可外を絞り込むフィルター関数
 */
function facilityGroup2Filter(feature, layer) {
    if(feature.properties.Type == '認可外') {
        return true;
    } else {
        return false;
    }
}

/**
 * GeoJson読み込み時、認可保育所を絞り込むフィルター関数
 */
function facilityGroup3Filter(feature, layer) {
    if(feature.properties.Type == '幼稚園') {
        return true;
    } else {
        return false;
    }
}

/**
 * GeoJsonで読み込んだ施設情報にポップアップを設定する
 */
function onEachFeatureFunc(feature,layer) {
    setPopup(feature,layer);
    setFacilities(feature,layer);
}

/**
 * 施設情報管理用変数に値をセット
 */
function setFacilities(feature,layer) {
    if (feature.properties){
        var facName = feature.properties.Name;
        var obj = {
            facility : facName,
            name : facName,
            lon : feature.geometry.coordinates[1],
            lat : feature.geometry.coordinates[0],
            layer : layer
        };
        facilities.push(obj);
        moveToList[facName] = obj;
    }
}

/**
 * ポップアップコンテンツを定義
 */
function setPopup(feature,layer) {
    var popupTitle = getPopupTitle(feature);
    var popupContent = getPopupContent(feature);

    // ポップアップ表示内容を生成
    var content = '';
    content += '<div id="popup-title" data-role="header" data-theme="a">' + popupTitle + '</div>';
    content += '<div id="popup-content" role="main">' + popupContent + '</div>';

    layer.bindPopup(content);
}

/**
 * ポップアップコンテンツのタイトルを定義する
 */
function getPopupTitle(feature)
{
    // タイトル部
    var title = '';
    var type = feature.properties['種別'] ? feature.properties['種別'] : feature.properties['Type'];
    title  = '[' + type + '] ';
    var owner = feature.properties['設置'] ? feature.properties['設置'] : feature.properties['Ownership'];
    if(owner !== undefined && owner !== null && owner !== "") {
        title += ' [' + owner +']';
    }
    var name = feature.properties['名称'] ? feature.properties['名称'] : feature.properties['Name'];
    title += name;
    url = feature.properties['url'];
    if(url != null && url != '') {
        title = '<a href="' +url+ '" target="_blank">' + title + '</a>';
    }
    return title;
}

/**
 * ポップアップコンテンツの内容を定義する
 */
function getPopupContent(feature) {
    var content = '';
    content += '<table><tbody>';
    var open  = feature.properties['開園時間'] ? feature.properties['開園時間'] : feature.properties['Open'];
    var close = feature.properties['終園時間'] ? feature.properties['終園時間'] : feature.properties['Close'];
    if (open !== undefined && open != null && open != "" && close != undefined && close != null && close != "") {
        content += '<tr>';
        content += '<th>時間</th>';
        content += '<td>';
        content += open + '〜' + close;
        content += '</td>';
        content += '</tr>';
    }
    var memo = feature.properties['備考'] ? feature.properties['備考'] : feature.properties['Memo'];
    if (memo !== undefined && memo !== null) {
        content += '<tr>';
        content += '<th></th>';
        content += '<td>' + memo + '</td>';
        content += '</tr>';
    }
    var temp    = feature.properties['一時'] ? feature.properties['一時'] : feature.properties['Temp'];
    var holiday = feature.properties['休日'] ? feature.properties['休日'] : feature.properties['holiday'];
    var night   = feature.properties['夜間'] ? feature.properties['夜間'] : feature.properties['Night'];
    var h24     = feature.properties['H24'] ? feature.properties['H24'] : feature.properties['H24'];

    if( temp !== null || holiday !== null || night !== null || h24 !== null) {
        content += '<tr>';
        content += '<th></th>';
        content += '<td>';
        if (temp !== undefined && temp !== null) {
            content += '一時保育 ';
        }
        if (holiday !== undefined && holiday !== null) {
            content += '休日保育 ';
        }
        if (night !== undefined && night !== null) {
            content += '夜間保育 ';
        }
        if (h24 !== undefined && h24 !== null) {
            content += '24時間 ';
        }
        content += '</td>';
        content += '</tr>';
    }

    var type = feature.properties['種別'] ? feature.properties['種別'] : feature.properties['Type'];
    if(type == "認可外") {
        content += '<tr>';
        content += '<th>監督基準</th>';
        content += '<td>';
        var proof = feature.properties['証明'] ? feature.properties['証明'] : feature.properties['Proof'];
        if (proof !== undefined && proof !== null) {
            content += '証明書発行済<a href="http://www.city.sapporo.jp/kodomo/kosodate/ninkagai_shisetsu.html" target="_blank">(詳細)</a>';
        }
        content += '</td>';
        content += '</tr>';
    }
    if(type == "認可保育所") {
        content += '<tr>';
        content += '<th>欠員</th>';
        content += '<td>';
        var vacancy = feature.properties['Vacancy'] ? feature.properties['Vacancy'] : feature.properties['Vacancy'];
        if (vacancy !== undefined && vacancy !== null) {
            content += '<a href="http://www.city.sapporo.jp/kodomo/kosodate/l4_01.html" target="_blank">空きあり</a>';
        }
        var vacancyDate = feature.properties['VacancyDate'];
        if (vacancyDate !== undefined && vacancyDate !== null) {
            content += " (" + vacancyDate + ")";
        }
        content += '</td>';
        content += '</tr>';
    }
    var ageS = feature.properties['開始年齢'] ? feature.properties['開始年齢'] : feature.properties['AgeS'];
    var ageE = feature.properties['終了年齢'] ? feature.properties['終了年齢'] : feature.properties['AgeE'];
    if (ageS !== undefined && ageS !== null && ageE !== undefined && ageE !== null) {
        content += '<tr>';
        content += '<th>年齢</th>';
        content += '<td>' + ageS + '〜' + ageE + '</td>';
        content += '</tr>';
    }
    var full = feature.properties['定員'] ? feature.properties['定員'] : feature.properties['Full'];
    if (full !== undefined && full !== null) {
        content += '<tr>';
        content += '<th>定員</th>';
        content += '<td>' + full + '人</td>';
        content += '</tr>';
    }
    var tel = feature.properties['TEL'] ? feature.properties['TEL'] : feature.properties['TEL'];
    if (tel !== undefined && tel !== null) {
        content += '<tr>';
        content += '<th>TEL</th>';
        content += '<td>' + tel + '</td>';
        content += '</tr>';
    }
    var add1 = feature.properties['住所１'] ? feature.properties['住所１'] : feature.properties['Add1'];
    var add2 = feature.properties['住所２'] ? feature.properties['住所２'] : feature.properties['Add2'];
    if (add1 !== undefined && add2 !== undefined) {
        content += '<tr>';
        content += '<th>住所</th>';
        content += '<td>' + add1 + add2 +'</td>';
        content += '</tr>';
    }
    var owner = feature.properties['設置者'] ? feature.properties['設置者'] : feature.properties['Owner'];
    if (owner !== undefined && owner !== null) {
        content += '<tr>';
        content += '<th>設置者</th>';
        content += '<td>' + owner + '</td>';
        content += '</tr>';
    }
    content += '</tbody></table>';
    return content;
}

/**
 * 縮尺完了後にマーカーのラベル表示・非表示を切り替える
 */
function showMarkerLabel(evt) {
    map.eachLayer(function(layer){
        if (layer instanceof L.Marker) {
            layer.hideLabel();
            layer.setLabelNoHide(false);
        }
    });
    if(map.getZoom() >= 14) {
        // 地図の現在の表示範囲を取得
        var mapBounds = map.getBounds();
        map.eachLayer(function(layer){
            if (layer instanceof L.Marker) {
                var layerLatLng = layer.getLatLng();
                // マーカーの緯度経度が現在の地図表示範囲に含まれてればラベルを表示
                if(mapBounds.contains(layerLatLng)) {
                    layer.showLabel();
                    layer.setLabelNoHide(true);
                }
            }
        });
    }
}
