const pgp = require('pg-promise')(/*options*/);

exports.query = function(callback){
    var db = pgp("postgres://postgres:test@127.0.0.1:5433/bukken");

    db.one("SELECT $1 AS value", 123)
        .then(function (data) {
            console.log("DATA:", data.value);
        })
        .catch(function (error) {
            console.log("ERROR:", error);
        });
}
