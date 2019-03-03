//jshint esversion:6

const express = require("express");
require('dotenv').config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect to remote Mongo Atlas database
mongoose.connect("mongodb+srv://" + process.env.ATLAS_CREDS + "@" + process.env.ATLAS_SERVER + "/todolistDB", {useNewUrlParser: true});

// Define schema
const itemsSchema = {
  name: String
};

// Create model (singular)
const Item = mongoose.model(
  "Item", itemsSchema
);

// Create a List schema with an array based on the itemsSchema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// Create a model for the List
const List = mongoose.model("List", listSchema);

// Create some documents (records)
const item1 = new Item ({
  name: "Welcome to your To Do list!"
});

const item2 = new Item ({
  name: "Use the + button to add a new item!"
});

const item3 = new Item ({
  name: "<-- Check off an item to delete it."
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
  const listName = req.body.list; // from the Submit button's value field

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){ // is this the default "Today" list?
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName //find the List record in the database
    }, function(err, foundList){
      foundList.items.push(item); // add this new item to the List's array
      foundList.save(); // save the object
      res.redirect("/" + listName); // send the user back to their custom list
    });
  }

});



app.post("/delete", function(req, res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemID, function(err){
        if (err){
          console.log(err);
        } else {
          console.log("Document successfully deleted :-o");
          res.redirect("/");
        }
    });
  } else { // Not the default list
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemID} } },
      function(err, foundList){
        if (!err){
          res.redirect("/" + listName);
        }
      }
    );
  }

});

// Allow the user to view/store custom list names
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  // Check if the list already exists
  List.findOne({
    name: customListName
  }, function (err, foundList){
    if (err){
      console.log(err);
    } else if (!foundList) { // List does NOT exist
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else { // List exists!
      // Show an existing list
      res.render("list", {listTitle: customListName, newListItems: foundList.items}); // foundList.items taps into the array store in the foundList object
    }
  });




});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server is running.");
});
