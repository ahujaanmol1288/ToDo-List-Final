//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-anmol:Test123@cluster0.wrmzg.mongodb.net/todolistDB",{useNewUrlParser: true});
//mongoose.set('useFindAndModify', false);

const itemsSchema = {
  name : String
};

const listSchema = {
  name : String ,
  items : [itemsSchema]
};

const List =mongoose.model("List",listSchema);

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name : "Welcome to your To-do List"
});

const item2 = new Item({
  name : "Hit the + Button to add a new item."
});

const item3 = new Item({
  name : "<-- Hit this to delete an item."
});


const defaultItems = [item1,item2,item3];

// Item.insertMany(defaultItems , function(err){
//   if(err){
//     console.log(err);
//   }else{
//     console.log("Successfully Saved.");
//   }
// });
//


app.get("/", function(req, res) {

  Item.find({}, function(err , foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems , function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully Saved.");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name : customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        //  Create a New list
        const list = new List({
          name : customListName,
          items : defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }else{
        // Show an existing list
        res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name : itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect('/');
  }else{
    List.findOne({name: listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});


app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName ;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(!err){
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  }else{
    //Mongoose remove document from array google
    // The $pull operator removes from an existing array all instances of a value or values that match a specified condition
    List.findOneAndUpdate({name : listName}, {$pull : {items : {id : checkedItemId}}}, function(err, foundList){
      if(!err){
        //console.log("check" + listName);
        res.redirect('/' + listName);
      }else{
        //console.log(err);
      }
    });
  }

});


app.get("/about", function(req, res){
  res.render("about");
});

// Deploying Part

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started");
});
