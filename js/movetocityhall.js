window.MoveToCityhall = function() {
};

/**
 * 区役所geojsonファイルを読み込み、moveToCityhall配列に格納する
 * @return {[type]} [description]
 */
MoveToCityhall.prototype.loadCityhallJson = function()
{
    var defd = new $.Deferred();
    // 区役所JSONデータ読み込み〜セレクトボックス追加
    $.getJSON(
        "data/cityhall.geojson",
        function(data){
            for(var i=0; i<data.features.length; i++) {
                _name = data.features[i].properties.name;
                _lat  = data.features[i].properties.lat;
                _lon  = data.features[i].properties.lon;
                moveToCityhall.push(
                    {name: _name, lat: _lat, lon: _lon}
                    );
            }
            defd.resolve();
        }).fail(function(){
            console.log('cityhall data load failed.');
            defd.reject('load error.');
        });
    return defd.promise();

};

/**
 * 区役所セレクトボックスに要素を追加する
 * @param  array moveToList [description]
 * @return {[type]}            [description]
 */
MoveToCityhall.prototype.appendToMoveToCityhall = function(moveToCityhall)
{
    nesting = [];
    for(i=0; i < moveToCityhall.length; i++) {
        //$('#moveToCityhall').append(nesting);
        nesting.push($('<option>').html(moveToCityhall[i].name).val(i));
    }
    if(nesting !== "") {
        $('#moveToCityhall').append(nesting);
    }
};
