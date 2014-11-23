window.MoveToList = function() {
};

/**
 * 駅geojsonファイルを読み込み、moveToList配列に格納する
 * @return {[type]} [description]
 */
MoveToList.prototype.loadStationJson = function()
{
    var d = new $.Deferred();
    // 駅位置JSONデータ読み込み〜セレクトボックス追加
    $.getJSON(
        "data/station.geojson",
        function(data){
            moveToList.push( {name: "公共交通機関施設", header:true} );
            var lineName = "";
            for(var i=0; i<data.features.length; i++) {
                _s = data.features[i].properties["shubetsu"] + " (" + data.features[i].properties["line"] + ")";
                if(lineName !== _s) {
                    moveToList.push({name: _s, header: true});
                    lineName = _s;
                }
                _name = data.features[i].properties.station_name;
                _lat  = data.features[i].properties.lat;
                _lon  = data.features[i].properties.lon;
                moveToList.push(
                    {name: _name, lat: _lat, lon: _lon, header:false}
                    );
            }
            d.resolve();
        }).fail(function(){
            console.log('station data load failed.');
            d.reject('load error.');
        });
    return d.promise();
};

/**
 * 最寄駅セレクトボックスに要素を追加する
 * @param  array moveToList [description]
 * @return {[type]}            [description]
 */
MoveToList.prototype.appendToMoveToListBox = function(moveToList)
{
    nesting = "";
    for(i=0; i < moveToList.length; i++) {
        if(moveToList[i].header) {
            if(nesting !== "") {
                $('#moveTo').append(nesting);
            }
            nesting = $('<optgroup>').attr('label', moveToList[i].name);
        } else {
            nesting.append($('<option>').html(moveToList[i].name).val(i));
        }
    }
    if(nesting !== "") {
        $('#moveTo').append(nesting);
    }
};
