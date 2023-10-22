const express = require('express');
const bodyparser = require('body-parser');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const expresslayouts = require('express-ejs-layouts');
const fileupload = require('express-fileupload');
const mongoclient = require('mongodb').MongoClient;



var app = express();
app.set('views', path.join(__dirname, "/view/"));
app.set('view engine', 'ejs');
app.set('layout', 'layouts/mainlayouts');

app.use(expresslayouts);
app.use(express.json());
app.use(express.urlencoded());


app.use(fileupload());
app.use(express.static(__dirname + "/public"));
app.use(session({ secret: 'hello' }));
app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});
var url = "mongodb://localhost:27017/venue_reservation";

var admin_login_collection = "";
var cat_collection = "";
var hall_owner_collection = "";
var cust_collection = "";
var hall_master_collection = "";
var hall_img_collection = "";
var charges_collection = "";
var booking_master_collection = ""
var booking_detail_collection = ""
var payment_collection = ""
mongoclient.connect(url, function (err, client) {
    if (err) throw (err)
    const db = client.db("venue_reservation");
    admin_login_collection = db.collection("admin_login");
    cat_collection = db.collection("category_master");
    hall_owner_collection = db.collection("hall_owner_regis");
    cust_collection = db.collection("customer_regis");
    hall_master_collection = db.collection("hall_master");
    hall_img_collection = db.collection("hall_image_detail");
    charges_collection = db.collection("hall_charges_detail");
    booking_master_collection = db.collection("booking_master");
    booking_detail_collection = db.collection("booking_detail");
    payment_collection = db.collection("payment_detail");
    console.log("Database Connected Successfully");
})


app.get("/", function (req, res) {
    res.render("default/home");
});

app.get("/about", function (req, res) {
    res.render("default/about");
})

app.get("/contact", function (req, res) {
    res.render("default/contact");
})

app.get("/customer_regis", function (req, res) {
    res.render("default/customer_regis")
})


app.get("/hall_owner_regis", function (req, res) {
    res.render("default/hall_owner_regis")
});

app.get("/login", function (req, res) {
    res.render("default/login")
});

//login code start...
app.post("/login_user", function (req, res) {
    const { txtemail, txtpwd } = req.body;
    sess = req.session;
    admin_login_collection.findOne({ email_id: txtemail, pwd: txtpwd }, function (err, result) {
        if (err) throw err;
        if (result === null) {
            hall_owner_collection.findOne({ email_id: txtemail, pwd: txtpwd }, function (err2, result2) {
                if (err2) throw err2;
                if (result2 === null) {
                    cust_collection.findOne({ email_id: txtemail, pwd: txtpwd }, function (err3, result3) {
                        if (err3) throw err3;
                        if (result3 === null) {
                            res.write("<script>alert('Check Your Email Id Or Password'); window.location.href='/login'; </script>")
                        } else {
                            //var row = JSON.parse(JSON.stringify(result3[0]));
                            //res.write("<script>alert('Customer Login Successfull'); window.location.href='/login'; </script>")
                            sess.custid = result3.customer_id;
                            if (sess.fdate) {
                                res.redirect("/customer_book_hall");
                            } else {
                                res.redirect("/venue");
                            }
                        }
                    });
                } else {
                    if (result2.status == 0) {
                        res.write("<script>alert('Wait Until Verify by Admin'); window.location.href='/login'; </script>")
                    } else if (result2.status == 1) {
                        sess.hoid = result2.hall_owner_id;

                        res.redirect("/hall_owner_manage_hall_detail");
                    } else if (result2.status == 2) {
                        res.write("<script>alert('Your Are Not Verified User Please Contact Our Admin'); window.location.href='/contact'; </script>")
                    }
                }
            });
        } else {
            res.write("<script>alert('Admin Login Successfull'); window.location.href='/admin_manage_category'; </script>")


        }
    });
})


app.get('/logout', function (req, res) {
    if (req.session) {
        sess = req.session;
        req.session.destroy(() => {
            res.redirect("/");
        });
    } else {
        res.redirect("/");
    }
})

//login code end...


//hall owner registration coding start..
app.post("/add_hall_owner", function (req, res) {



    let sampleFile;
    let uploadpath;
    let tmppath;

    const max = 9999;
    const min = 1000;
    const x = (Math.random() * (max - min)) + min;

    if (!req.files || Object.keys(req.files).length == 0) {
        res.write("<script>alert('Please Select Licenser Image'); window.location.href='/hall_owner_regis';</script>")
    } else {
        const { txtname, txtadd, txtcity, txtmno, txtemail, txtpwd } = req.body;
        hall_owner_collection.findOne({ email_id: txtemail }, function (err, result) {
            if (err) throw err;
            if (result === null) {
                sampleFile = req.files.txtimg;
                let hoid = 0;
                hall_owner_collection.find().sort({ hall_owner_id: -1 }).limit(1).toArray(function (err, data1) {
                    if (err) throw err;
                    if (data1.length === 0) {
                        hoid = 1;
                    } else {
                        var row = JSON.parse(JSON.stringify(data1[0]));
                        hoid = row.hall_owner_id + 1;
                    }

                    tmppath = "/lic_img/LI" + hoid + "_" + Math.floor(x) + ".jpg";
                    uploadpath = __dirname + "/public" + tmppath;

                    var newdate = new Date();

                    var rdate = newdate.getFullYear() + "-" + (newdate.getMonth() + 1) + "-" + newdate.getDate();
                    hall_owner_collection.insertOne({ hall_owner_id: hoid, hall_owner_name: txtname, address: txtadd, city: txtcity, mobile_no: txtmno, email_id: txtemail, pwd: txtpwd, regis_date: rdate, lic_path: tmppath, status: 0 }, function (err) {
                        if (err) throw err;
                        sampleFile.mv(uploadpath, function (err) {
                            if (err) throw err;
                            res.write("<script>alert('Hall Owner Registered Successfully Wait 24 hours for verification'); window.location.href='/login';</script>")
                        })
                    })
                })
            } else {
                res.write("<script>alert('Email Id already Exists'); window.location.href='/hall_owner_regis';</script>")
            }

        })

    }
})

//hall owner registration coding end..

//customer registration coding start..

app.post("/add_cust", function (req, res) {

    const { txtname, txtadd, txtcity, txtmno, txtemail, txtpwd, gender } = req.body;
    cust_collection.findOne({ email_id: txtemail }, function (err, result) {
        if (err) throw err;
        if (result === null) {

            let custid = 0;
            cust_collection.find().sort({ customer_id: -1 }).limit(1).toArray(function (err, data1) {
                if (err) throw err;
                if (data1.length === 0) {
                    custid = 1;
                } else {
                    var row = JSON.parse(JSON.stringify(data1[0]));
                    custid = row.customer_id + 1;
                }

                cust_collection.insertOne({ customer_id: custid, customer_name: txtname, address: txtadd, city: txtcity, mobile_no: txtmno, email_id: txtemail, pwd: txtpwd, gender: gender }, function (err) {
                    if (err) throw err;
                    res.write("<script>alert('Customer Registered Successfully'); window.location.href='/login';</script>")
                })
            })
        } else {
            res.write("<script>alert('Email Id already Exists'); window.location.href='/customer_regis';</script>")
        }

    })
})

//customer registration coding end.....

//admin manage category code start....

app.get("/admin_manage_category", function (req, res) {
    cat_collection.find().toArray(function (err, result) {

        res.render('admin/admin_manage_category', { layout: 'layouts/adminlayouts', catitems: result });
    });
});

app.post("/save_cat", function (req, res) {
    const { txtcat } = req.body;

    cat_collection.findOne({ category: txtcat }, function (err, result) {
        if (err) throw err;
        if (result === null) {
            let catid = 0;
            cat_collection.find().sort({ cat_id: -1 }).limit(1).toArray(function (err, data1) {
                if (err) throw err;
                if (data1.length === 0) {
                    catid = 1;
                } else {
                    var row = JSON.parse(JSON.stringify(data1[0]));
                    catid = row.cat_id + 1;
                }

                cat_collection.insertOne({ cat_id: catid, category: txtcat }, function (err) {
                    if (err) throw err;
                    res.write("<script>alert('Category Saved Successfully'); window.location.href='/admin_manage_category';</script>")
                })
            })
        }
        else {
            res.write("<script>alert('Category already Exists'); window.location.href='/admin_manage_category';</script>")
        }
    })

})

app.get("/delete_cat/:cid", function (req, res) {
    let catid = parseInt(req.params.cid);
    cat_collection.remove({ cat_id: catid }, function (err, result) {
        if (err) throw err;
        res.write("<script>alert('Category Deleted Successfully'); window.location.href='/admin_manage_category';</script>")
    })
})

app.get("/edit_cat/:cid", function (req, res) {
    let catid = parseInt(req.params.cid);
    cat_collection.find({ cat_id: catid }).toArray(function (err, result) {
        console.log(result);
        res.render('admin/admin_edit_category', { layout: 'layouts/adminlayouts', catitems: result });
    });
})

app.post("/update_cat", function (req, res) {
    const { txtcat, txtcatid } = req.body;
    cat_collection.updateOne({ cat_id: parseInt(txtcatid) }, { $set: { category: txtcat } }, function (err, result) {
        if (err) throw err;
        res.write("<script>alert('Category Updated Successfully'); window.location.href='/admin_manage_category';</script>")
    })
})
//admin manage category code end....



//ADMIN VERIFY HALL OWNER CODING START...
app.get("/admin_verify_hall_owner", function (req, res) {
    hall_owner_collection.find({ status: 0 }).toArray(function (err, result) {

        res.render('admin/admin_verify_hall_owner', { layout: 'layouts/adminlayouts', hitems: result });
    });
});


app.get("/verify_hall_owner/:hoid", function (req, res) {
    let hoid = parseInt(req.params.hoid);
    hall_owner_collection.updateOne({ hall_owner_id: parseInt(hoid) }, { $set: { status: 1 } }, function (err, result) {
        if (err) throw err;
        res.write("<script>alert('Hall Owner Verified Successfully'); window.location.href='/admin_verify_hall_owner';</script>")
    })
})


app.get("/not_verify_hall_owner/:hoid", function (req, res) {
    let hoid = parseInt(req.params.hoid);
    hall_owner_collection.updateOne({ hall_owner_id: parseInt(hoid) }, { $set: { status: 2 } }, function (err, result) {
        if (err) throw err;
        res.write("<script>alert('Hall Owner Not Verified Successfully'); window.location.href='/admin_verify_hall_owner';</script>")
    })
})
//ADMIN VERIFY HALL OWNER CODING END...

//admin report coding start...
app.get("/admin_view_hall_owner_report", function (req, res) {
    hall_owner_collection.find({ status: 1 }).toArray(function (err, result) {
        res.render('admin/admin_view_hall_owner_report', { layout: 'layouts/adminlayouts', hitems: result });
    });
});


app.get("/admin_view_hall_owner_wise_hall_detail_report/:hid", function (req, res) {
    cat_collection.find().toArray(function (err, result) {
        hall_master_collection.find({ hall_owner_id: parseInt(req.params.hid) }).toArray(function (err1, result1) {
            res.render('admin/admin_view_hall_owner_wise_hall_detail_report', { layout: 'layouts/adminlayouts', catitems: result, hitems: result1 });
        })
    });
});

app.get("/admin_view_hall_wise_booking_report/:hid", function (req, res) {
    let items = [];
    booking_master_collection.find({ hall_id: parseInt(req.params.hid) }).toArray(function (err, result2) {

        hall_master_collection.find().toArray(function (err2, result3) {
            charges_collection.find().toArray(function (err3, result4) {
                cust_collection.find().toArray(function (err5, result5) {
                    res.render("admin/admin_view_hall_wise_booking_report", {
                        bitems: result2,
                        hitems: result3,
                        chitems: result4,
                        citems: result5,
                        layout: 'layouts/adminlayouts'
                    });
                })
            })
        })
    });
})

app.get("/admin_view_customer_report", function (req, res) {
    cust_collection.find().toArray(function (err, result) {
        res.render('admin/admin_view_customer_report', { layout: 'layouts/adminlayouts', citems: result });
    });
});


app.get("/admin_view_customer_wise_booking_report/:cid", function (req, res) {
    let items = [];
    booking_master_collection.find({ customer_id: parseInt(req.params.cid) }).toArray(function (err, result2) {
        hall_master_collection.find().toArray(function (err2, result3) {
            charges_collection.find().toArray(function (err3, result4) {
                cust_collection.find().toArray(function (err5, result5) {
                    res.render("admin/admin_view_customer_wise_booking_report", {
                        bitems: result2,
                        hitems: result3,
                        chitems: result4,
                        citems: result5,
                        layout: 'layouts/adminlayouts'
                    });
                })
            })
        })
    });
})




app.get("/admin_view_cat_wise_booking_report", function (req, res) {
    let items = [];
    let bitems = [];
    let hitems = [];
    let chitems = [];
    let citems = [];
    cat_collection.find().toArray(function (err, result) {
        res.render("admin/admin_view_cat_wise_booking_report", {
            catitems: result,
            bitems: bitems,
            hitems: hitems,
            chitems: chitems,
            citems: citems,
            layout: 'layouts/adminlayouts'
        });
    });
});


app.post("/view_rpt1", function (req, res) {
    const { selcat } = req.body;
    let items = [];
    console.log(selcat);
    cat_collection.find().toArray(function (err, result) {

        hall_master_collection.find({ cat_id: parseInt(selcat) }).project({ _id: 0, hall_id: 1 }).toArray(function (err, result12) {
            //console.log(result12);
            for (var i = 0; i < result12.length; i++) {
                items.push(result12[i].hall_id);
            }
            //console.log(items);
            booking_master_collection.find({ hall_id: { $in: items } }).toArray(function (err, result2) {
                hall_master_collection.find().toArray(function (err2, result3) {
                    charges_collection.find().toArray(function (err3, result4) {
                        cust_collection.find().toArray(function (err5, result5) {
                            res.render("admin/admin_view_cat_wise_booking_report", {
                                catitems: result,
                                bitems: result2,
                                hitems: result3,
                                chitems: result4,
                                citems: result5,
                                layout: 'layouts/adminlayouts'
                            });
                        })
                    })
                })
            });
        });
    });
});


app.get("/admin_view_all_booking_report", function (req, res) {
    
        //console.log(items);
        booking_master_collection.find().toArray(function (err, result2) {
            console.log(result2);
            hall_master_collection.find().toArray(function (err2, result3) {
                charges_collection.find().toArray(function (err3, result4) {
                    cust_collection.find().toArray(function (err5, result5) {
                        res.render("admin/admin_view_all_booking_report", {
                           
                           
                            bitems: result2,
                            hitems: result3,
                            chitems: result4,
                            citems: result5,
                            layout: 'layouts/adminlayouts'
                        });
                    })
                })
            })
        });


});

//admin report coding end...
//admin coding end...



//hall owner manage hall detail coding start...

app.get("/hall_owner_manage_hall_detail", function (req, res) {
    sess = req.session;
    cat_collection.find().toArray(function (err, result) {

        hall_master_collection.find({ hall_owner_id: parseInt(sess.hoid) }).toArray(function (err1, result1) {
            res.render('hallowner/hall_owner_manage_hall_detail', { layout: 'layouts/hallownerlayouts', catitems: result, hitems: result1 });
        })

    });
});

app.post("/add_hall_detail", function (req, res) {
    const { txthname, txtadd, txtchairs, txtsofas, txtcapacity, txtdesc, txtrooms, selcat } = req.body;
    sess = req.session;

    let hid = 0;
    hall_master_collection.find().sort({ hall_id: -1 }).limit(1).toArray(function (err, data1) {
        if (err) throw err;
        if (data1.length === 0) {
            hid = 1;
        } else {
            var row = JSON.parse(JSON.stringify(data1[0]));
            hid = row.hall_id + 1;
        }

        hall_master_collection.insertOne({ hall_id: hid, hall_name: txthname, address: txtadd, capacity: txtcapacity, description: txtdesc, no_of_chairs: txtchairs, no_of_sofas: txtsofas, no_of_rooms: txtrooms, cat_id: parseInt(selcat), hall_owner_id: parseInt(sess.hoid) }, function (err) {
            if (err) throw err;
            res.write("<script>alert('Hall Detail Saved Successfully'); window.location.href='/hall_owner_manage_hall_detail';</script>")
        })
    })


})

app.get("/hall_owner_edit_hall_detail/:hid", function (req, res) {
    let hid = parseInt(req.params.hid);
    cat_collection.find().toArray(function (err, result) {
        hall_master_collection.find({ hall_id: hid }).toArray(function (err2, result2) {
            //console.log(result);
            res.render('hallowner/hall_owner_edit_hall_detail', { layout: 'layouts/hallownerlayouts', catitems: result, hitems: result2 });
        });
    });
})

app.post("/update_hall_detail", function (req, res) {
    const { txthname, txtadd, txtchairs, txtsofas, txtcapacity, txtdesc, txtrooms, selcat, txthid } = req.body;
    sess = req.session;
    hall_master_collection.updateOne({ hall_id: parseInt(txthid) }, { $set: { hall_name: txthname, address: txtadd, capacity: txtcapacity, description: txtdesc, no_of_chairs: txtchairs, no_of_sofas: txtsofas, no_of_rooms: txtrooms, cat_id: parseInt(selcat) } }, function (err, result) {
        if (err) throw err;
        res.write("<script>alert('Hall Detail Updated Successfully'); window.location.href='/hall_owner_manage_hall_detail';</script>")
    })
})

//hall owner manage hall detail coding end...

//hall owner manages hall images coding start....

app.get("/hall_owner_manage_hall_images/:hid", function (req, res) {
    hid = parseInt(req.params.hid);
    sess = req.session;
    hall_img_collection.find({ hall_id: hid }).toArray(function (err, result) {

        res.render('hallowner/hall_owner_manage_hall_images', { layout: 'layouts/hallownerlayouts', imgitems: result, hid: hid });


    });
});


app.post("/upload_hall_image", function (req, res) {
    const { txthid } = req.body;

    sess = req.session;
    let sampleFile;
    let uploadpath;
    let tmppath;

    const max = 9999;
    const min = 1000;
    const x = (Math.random() * (max - min)) + min;

    if (!req.files || Object.keys(req.files).length == 0) {
        res.write("<script>alert('Please Select Hall Image'); window.location.href='/hall_owner_manage_hall_images/" + txthid + "';</script>")
    } else {


        sampleFile = req.files.txtimg;
        let iid = 0;
        hall_img_collection.find().sort({ image_id: -1 }).limit(1).toArray(function (err, data1) {
            if (err) throw err;
            if (data1.length === 0) {
                iid = 1;
            } else {
                var row = JSON.parse(JSON.stringify(data1[0]));
                iid = row.image_id + 1;
            }

            tmppath = "/hallimg/HI" + iid + "_" + Math.floor(x) + ".jpg";
            uploadpath = __dirname + "/public" + tmppath;

            var newdate = new Date();


            hall_img_collection.insertOne({ image_id: iid, hall_id: parseInt(txthid), image_path: tmppath }, function (err) {
                if (err) throw err;
                sampleFile.mv(uploadpath, function (err) {
                    if (err) throw err;
                    res.write("<script>alert('Hall Image Uploaded Successfully'); window.location.href='/hall_owner_manage_hall_images/" + txthid + "';</script>")
                })
            })
        })
    }
});


app.get("/delete_hall_images/:iid/:hid", function (req, res) {
    let iid = parseInt(req.params.iid);
    let hid = parseInt(req.params.hid);
    hall_img_collection.remove({ image_id: iid }, function (err, result) {
        if (err) throw err;
        res.write("<script>alert('Image Deleted Successfully'); window.location.href='/hall_owner_manage_hall_images/" + hid + "';</script>")
    })
})
//hall owner manages hall images coding end....


//hall owner manage hall charges coding start...

app.get("/hall_owner_manage_charges", function (req, res) {
    sess = req.session;
    let items = [];
    hall_master_collection.find({ hall_owner_id: parseInt(sess.hoid) }).project({ _id: 0, hall_id: 1 }).toArray(function (err, result) {

        for (var i = 0; i < result.length; i++) {
            items.push(result[i].hall_id);
        }
        console.log(items)
        charges_collection.find({ hall_id: { $in: items } }).toArray(function (err, result2) {
            hall_master_collection.find({ hall_owner_id: parseInt(sess.hoid) }).toArray(function (err1, result1) {
                res.render('hallowner/hall_owner_manage_charges', { layout: 'layouts/hallownerlayouts', hitems: result1, citems: result2 });
            })
        })
    })
});


app.post("/add_charges", function (req, res) {
    const { selhall, seltime, txthcharge } = req.body;
    sess = req.session;
    charges_collection.findOne({ hall_id: parseInt(selhall), time_type: seltime }, function (err, result) {
        if (err) throw err;
        if (result === null) {
            let chid = 0;
            charges_collection.find().sort({ charge_id: -1 }).limit(1).toArray(function (err, data1) {
                if (err) throw err;
                if (data1.length === 0) {
                    chid = 1;
                } else {
                    var row = JSON.parse(JSON.stringify(data1[0]));
                    chid = row.charge_id + 1;
                }

                charges_collection.insertOne({ charge_id: chid, hall_id: parseInt(selhall), time_type: seltime, hall_charge: txthcharge }, function (err) {
                    if (err) throw err;
                    res.write("<script>alert('Charges Saved Successfully'); window.location.href='/hall_owner_manage_charges';</script>")
                })
            })
        }
        else {
            res.write("<script>alert('Charges already Added'); window.location.href='/hall_owner_manage_charges';</script>")
        }
    })

})

app.get("/delete_charges/:cid", function (req, res) {
    let cid = parseInt(req.params.cid);

    charges_collection.remove({ charge_id: cid }, function (err, result) {
        if (err) throw err;
        res.write("<script>alert('Charges Deleted Successfully'); window.location.href='/hall_owner_manage_charges';</script>")
    })
})
//hall owner manage hall charges coding end...
app.get("/venue", function (req, res) {
    sess = req.session;

    cat_collection.find().toArray(function (err, result) {
        hall_master_collection.find().toArray(function (err, result2) {
            hall_img_collection.find().toArray(function (err, result3) {
                if (sess.custid) {
                    res.render('default/venue', { layout: 'layouts/customerlayouts', catitems: result, hitems: result2, imgitems: result3 });
                } else {
                    res.render('default/venue', { layout: 'layouts/mainlayouts', catitems: result, hitems: result2, imgitems: result3 });
                }
            });
        });
    });
});

app.get("/venue_cat/:cid", function (req, res) {
    sess = req.session;
    let cid = parseInt(req.params.cid);
    cat_collection.find().toArray(function (err, result) {
        hall_master_collection.find({ cat_id: cid }).toArray(function (err, result2) {
            hall_img_collection.find().toArray(function (err, result3) {
                if (sess.custid) {
                    res.render('default/venue', { layout: 'layouts/customerlayouts', catitems: result, hitems: result2, imgitems: result3 });
                } else {
                    res.render('default/venue', { layout: 'layouts/mainlayouts', catitems: result, hitems: result2, imgitems: result3 });
                }

            });
        });
    });
});
//display venue coding start...

//customer side hall detail display coding start...
app.get("/customer_view_hall_detail/:hid", function (req, res) {
    sess = req.session;
    let hid = parseInt(req.params.hid)

    hall_master_collection.find({ hall_id: hid }).toArray(function (err, result2) {
        hall_img_collection.find({ hall_id: hid }).toArray(function (err, result3) {
            charges_collection.find({ hall_id: hid }).toArray(function (err, result4) {
                if (sess.custid) {
                    res.render('customer/customer_view_hall_detail', { layout: 'layouts/customerlayouts', hitems: result2, imgitems: result3, chitems: result4 });
                } else {
                    res.render('customer/customer_view_hall_detail', { layout: 'layouts/mainlayouts', hitems: result2, imgitems: result3, chitems: result4 });
                }


            });
        });
    });

});



app.get("/customer_check_avability/:hid", function (req, res) {
    sess = req.session;
    var newdate = new Date(new Date().getTime() + (1 * 24 * 60 * 60 * 1000));
    //console.log(newdate);
    var month = newdate.getMonth() + 1
    if (newdate.getMonth() < 10) {
        month = '0' + month;
    }
    var day = newdate.getDate();
    if (newdate.getDate() < 10) {
        day = '0' + newdate.getDate();
    }

    var hid = req.params.hid;
    console.log("hid = " + hid);
    var lbdate = newdate.getFullYear() + "-" + month + "-" + day;
    if (sess.custid) {
        res.render("customer/customer_check_avability", {
            hid: hid,
            lbdate: lbdate,
            layout: 'layouts/customerlayouts'
        });
    } else {
        res.render("customer/customer_check_avability", {
            hid: hid,
            lbdate: lbdate,
            layout: 'layouts/mainlayouts'
        });
    }

})


app.post("/check_avability", function (req, res) {
    const { txtfdate, txttdate, txthid } = req.body;
    let items = []
    sess = req.session;
    sess.fdate = txtfdate;
    sess.tdate = txttdate;
    sess.hid = txthid;
    console.log("session hid = " + sess.hid);
    console.log("txthid = " + txthid);
    booking_master_collection.find({ hall_id: parseInt(txthid) }).project({ _id: 0, booking_id: 1 }).toArray(function (err1, result1) {
        for (var i = 0; i < result1.length; i++) {
            items.push(result1[i].booking_id);
        }

        booking_detail_collection.find({ $and: [{ booking_id: { $in: items } }, { booking_date: { $gte: new Date(txtfdate) } }, { booking_date: { $lte: new Date(txttdate) } }] }).toArray(function (err, result2) {
            console.log(result2);
            if (result2.length > 0) {
                res.write("<script>alert('Hall is Booked for this date Please Try Another date'); window.location.href='/customer_check_avability/" + txthid + "';</script>");
            } else {
                if (sess.custid) {

                    res.redirect("/customer_book_hall");
                } else {

                    res.redirect("/login");
                    //res.write("<script>alert('Hall Is Avaliable'); window.location.href='/login';</script>")
                }
            }
        });
    })
})
//customer side hall detail display coding end...

//customer book hall coding start...
app.get("/customer_book_hall", function (req, res) {
    sess = req.session;
    var fdate = new Date(sess.fdate);
    var tdate = new Date(sess.tdate);
    console.log(sess.hid);
    hid = sess.hid;


    console.log(hid);
    var month1 = fdate.getMonth() + 1
    if (fdate.getMonth() < 10) {
        month1 = '0' + month1;
    }
    var day1 = fdate.getDate();
    if (fdate.getDate() < 10) {
        day1 = '0' + fdate.getDate();
    }

    var month2 = tdate.getMonth() + 1
    if (tdate.getMonth() < 10) {
        month2 = '0' + month2;
    }
    var day2 = tdate.getDate();
    if (tdate.getDate() < 10) {
        day2 = '0' + tdate.getDate();
    }
    var fdate1 = fdate.getFullYear() + "-" + month1 + "-" + day1;
    var tdate1 = tdate.getFullYear() + "-" + month2 + "-" + day2;
    delete sess.fdate;
    delete sess.tdate;
    delete sess.hid;
    res.render("customer/customer_book_hall", {
        hid: hid,
        fdate: fdate1,
        tdate: tdate1,
        layout: 'layouts/customerlayouts'
    });
})


app.post("/book_hall", function (req, res) {
    const { txtfdate, txttdate, seltime, txthid } = req.body;


    const fdate = new Date(txtfdate);
    const tdate = new Date(txttdate);
    const difftime = Math.abs(tdate - fdate);
    const diffdays = Math.ceil(difftime / (1000 * 60 * 60 * 24)) + 1;

    sess = req.session;


    custid = parseInt(sess.custid);
    var newdate = new Date();
    var bdate = newdate.getFullYear() + "-" + (newdate.getMonth() + 1) + "-" + newdate.getDate();
    var fdate1 = fdate.getFullYear() + "-" + (fdate.getMonth() + 1) + "-" + fdate.getDate();
    var tdate1 = tdate.getFullYear() + "-" + (tdate.getMonth() + 1) + "-" + tdate.getDate();
    let chargeid = "";
    let charge = "";
    let tamt;
    charges_collection.findOne({ time_type: seltime }, function (err, result) {
        chargeid = result.charge_id;
        charge = result.hall_charge;
        //        console.log(chargeid + " " + charge + " " + diffdays + " " + txthid);
        tamt = ((parseInt(charge)) * (parseInt(diffdays)));
        console.log(tamt);
    });


    let bookid = 0;
    booking_master_collection.find().sort({ booking_id: -1 }).limit(1).toArray(function (err, data1) {
        if (err) throw err;
        if (data1.length === 0) {
            bookid = 1;
        } else {
            var row = JSON.parse(JSON.stringify(data1[0]));
            bookid = row.booking_id + 1;
        }

        booking_master_collection.insertOne({ booking_id: bookid, booking_date: bdate, event_start_date: fdate1, event_end_date: tdate1, no_of_days: diffdays, hall_id: parseInt(txthid), charge_id: chargeid, hall_charge: charge, customer_id: custid }, function (err) {
            if (err) throw err;

            for (var i = 0; i < diffdays; i++) {
                var xdate = new Date(fdate);
                var newdate = new Date(xdate.getTime() + (i * (24 * 60 * 60 * 1000)));
                var bdate1 = newdate.getFullYear() + "-" + (newdate.getMonth() + 1) + "-" + newdate.getDate();
                booking_detail_collection.insertOne({ booking_id: bookid, booking_date: new Date(bdate1) }, function (err) {

                });
            }
            res.write("<script>alert('Hall Booked Successfully'); window.location.href='/customer_pay/" + bookid + "/" + tamt + "';</script>")
        })
    })

})

//customer book hall coding end...


//customer payment coding start..
app.get("/customer_pay/:bid/:amt", function (req, res) {
    let bid = req.params.bid;
    let amt = req.params.amt;
    res.render("customer/customer_pay", {
        bid: bid,
        amt: amt,
        layout: 'layouts/customerlayouts'
    });
});


app.post("/pay", function (req, res) {

    const { selctype, txtcno, txtcvvno, txtbname, txtname, selexmonth, selexyear, txtbid, txtamt } = req.body;
    let edate = selexmonth + "-" + selexyear
    let pid = 0;
    payment_collection.find().sort({ pay_id: -1 }).limit(1).toArray(function (err, data1) {
        if (err) throw err;
        if (data1.length === 0) {
            pid = 1;
        } else {
            var row = JSON.parse(JSON.stringify(data1[0]));
            pid = row.pay_id + 1;
        }

        payment_collection.insertOne({ pay_id: pid, booking_id: parseInt(txtbid), card_tye: selctype, card_no: txtcno, cvv_no: txtcvvno, bank_name: txtbname, card_holder_name: txtname, expiry_date: edate, amount: parseInt(txtamt) }, function (err) {
            if (err) throw err;
            res.write("<script>alert('Payment Done Successfully'); window.location.href='/customer_view_booking';</script>")
        })
    })
})
//customer payment coding end..


//customer view booking coding start....
app.get("/customer_view_booking", function (req, res) {

    sess = req.session;
    booking_master_collection.find({ customer_id: parseInt(sess.custid) }).toArray(function (err, result) {
        hall_master_collection.find().toArray(function (err2, result2) {
            charges_collection.find().toArray(function (err3, result3) {
                res.render("customer/customer_view_booking", {
                    bitems: result,
                    hitems: result2,
                    chitems: result3,
                    layout: 'layouts/customerlayouts'
                });
            })
        })
    })

});

//customer view booking coding end....


//hall owner view booking coding start...

app.get("/hall_owner_view_booking", function (req, res) {
    sess = req.session;
    let hoid = parseInt(sess.hoid);
    let items = [];
    hall_master_collection.find({ hall_owner_id: hoid }).project({ _id: 0, hall_id: 1 }).toArray(function (err1, result1) {
        for (var i = 0; i < result1.length; i++) {
            items.push(result1[i].hall_id);
        }
        console.log(items);
        booking_master_collection.find({ hall_id: { $in: items } }).toArray(function (err, result2) {

            hall_master_collection.find().toArray(function (err2, result3) {
                charges_collection.find().toArray(function (err3, result4) {
                    cust_collection.find().toArray(function (err5, result5) {
                        res.render("hallowner/hall_owner_view_booking", {
                            bitems: result2,
                            hitems: result3,
                            chitems: result4,
                            citems: result5,
                            layout: 'layouts/hallownerlayouts'
                        });
                    })

                })
            })
        });
    })

})
//hall owner view booking coding end...



//display venue coding end...
app.listen(3000, function () {
    console.log("Server Started At Port No 3000 Click here http://127.0.0.1:3000/ to open Webpage");
})