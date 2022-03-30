//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connect and create new db:
mongoose.connect("mongodb+srv://admin-lukas:Abababab11@cluster0.52esg.mongodb.net/todolistDB", {useNewUrlParser: true});

//create mngs schema:
const itemsSchema = {
  name: String
};
//create model:
const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "eat vegan",
});

const item2 = new Item({
  name: "eat clean",
});

const item3 = new Item({
  name: "fast intermittently",
});

//create an array:
const defaultItems = [item1, item2, item3];

//1.step create schema:
const listSchema = {
  name: String,
  items: [itemsSchema] //array if item documents
};
//2.step create model:
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  //find all items:
  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName); //capitilize it using lodash mdl

  //find if list name entered in browser already exists:
  // find the list with this name:
  List.findOne({name: customListName}, function(err, foundList){
    //if no errs:
    if (!err){
      //if the list doesnt exist, create a new list
      if (!foundList){
        //3.step: create new list documents:
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
        //if the list exists, show it:
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox; // gets "value" of the name="", i.g. ID!
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    //(first what we want find), (2nd: )
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
