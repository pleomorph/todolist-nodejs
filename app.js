//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

// Define schema
const itemsSchema = {
  name: String
};

// Create model (singular)
const Item = mongoose.model(
  "Item", itemsSchema
);

// Create some documents (records)
const item1 = new Item ({
  name: "Buy Food"
});

const item2 = new Item ({
  name: "Cook Food"
});

const item3 = new Item ({
  name: "Eat Food"
});

// Put the default items in an array
const defaultItems = [item1, item2, item3];



app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if (err){
      console.log(err);
    }else if (foundItems.length === 0){
      // Insert many into the database if it is empty
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to the database.");
        }
      });
      // Now that they're added, show the list by coming back into / again
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;

  const item = new Item({
    name: itemName
  });

  item.save();

  res.redirect("/");

});



app.post("/delete", function(req, res){
  const checkedItemID = req.body.checkbox;

  Item.findByIdAndRemove(checkedItemID, function(err){
      if (err){
        console.log(err);
      } else {
        console.log("Document successfully deleted :-o");
        res.redirect("/");
      }
  });

});




app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
