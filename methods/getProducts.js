const readFile = require("../util/readFile");

module.exports = function (page_no, cb) {
    readFile("./products.txt", (err, data) => {
        // console.log("get products data", data);
        let products = data ? JSON.parse(data) : [];
        const productsPerPage = 5;
        const total_pages = Math.ceil(products.length / productsPerPage);
        const lastProductIndex = products.length - 1;
        var arr = [];
        if (page_no <= total_pages) {
            for (var i = 0; i < page_no * productsPerPage && i <= lastProductIndex; i++) {
                arr.push(products[i]);
            }
        }
        else {
            arr = products;
        }
        cb(arr, total_pages);
    })
}