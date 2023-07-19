
var express = require('express');
var router = express.Router();
var mysql = require('../mysql.js');
var nodejieba = require('@node-rs/jieba');

/* GET home page. */
router.get('/', function(req, res, next) {
    // res.render('index', { title: 'Express' });
    res.render('index', { title: 'Express', showFloatingMelons: true });
});

router.get('/search', function(request, response) {
    var fetchSql="";
    if(request.query.source != "所有网站"){
      //sql字符串和参数
      var fetchSql = "select title,source_name,publish_date,url " +
    "from fetches where source_name like '%" + request.query.source+"%'";
      var keywords = request.query.title.split(" ");
      for(var i=0;i<keywords.length;i++){
        fetchSql+="and title like '%"+ keywords[i] + "%'";
      }
    }else{
      var keywords = request.query.title.split(" ");
      var fetchSql = "select title,source_name,publish_date,url from fetches"
      for(var i=0;i<keywords.length;i++){
        if(i == 0){
          fetchSql+=" where title like '%"+ keywords[i] + "%'";
        }else{
          fetchSql+="and title like '%"+ keywords[i] + "%'";
        }
      }
    }
    console.log(request.query.sorted);
    if(request.query.sorted == '默认'){
      fetchSql += ";";
    } else if(request.query.sorted == '顺序'){
      fetchSql += " order by publish_date;";
    }
    else{
      fetchSql +=" order by publish_date desc;";
    }

    console.log(fetchSql);
    mysql.query(fetchSql, function(err, result, fields) {
        var res = result;
        regExp = /(\d{4})-(\d{2})-(\d{2})/
        
        for (var i = 0;i<res.length;i++){
          tmp = (res[i]);
          res[i].publish_date = regExp.exec(JSON.stringify(res[i].publish_date))[0];
        }
        response.json({message:'data',result:result});
    });
});

router.get('/line',function(request,response){
  var keyword = request.query.keyword;
  console.log(keyword);
  var fetchSql = "select publish_date,count(*) as num from fetches where content like '%"+keyword+"%' and publish_date>'2023-01-01' group by publish_date order by publish_date;";
  console.log(fetchSql);
  mysql.query(fetchSql,function(err, result,fields){
    var time = [];
    var num = [];
    // console.log(result);
    regExp = /(\d{4})-(\d{2})-(\d{2})/
    //处理查询的结果，以便符合作图时的数据格式
    for (var i = 0;i<result.length;i++){
      time.push(regExp.exec(JSON.stringify(result[i].publish_date))[0]);
      num.push(result[i].num);
  }
  response.json({message:'data',time:time,num:num});
  });
});

router.get('/histogram', function(request, response) {
  var keyword = request.query.keyword;
  console.log(keyword);
  var fetchSql = "select publish_date,count(*) as num from fetches where content like '%"+keyword+"%' and publish_date>'2023-01-01' group by publish_date order by publish_date;";
  console.log(fetchSql);
  mysql.query(fetchSql,function(err, result,fields){
  //   response.writeHead(200, {
  //     "Content-Type": "application/json"
  // });
  var time = [];
  var num = [];
  console.log(result);
  regExp = /(\d{4})-(\d{2})-(\d{2})/
  for (var i = 0;i<result.length;i++){
    time.push(regExp.exec(JSON.stringify(result[i].publish_date))[0]);
    num.push(result[i].num);
  }
  console.log(time);
  console.log(num);
  response.json({message:'data',time:time,num:num});
  console.log(keyword);
  });
});

router.get('/wordcloud',function(request,response){
  // 正则表达式去掉一些无用的字符、停用词
  const regex = /[\t\s\r\n\d\w]|[\+\-\(\),\.。，！？《》@、【】"'：:%-\/“”]/g;

  var fetchSql = "select keywords from fetches;";
  mysql.query(fetchSql,function(err, result,fields){
    response.writeHead(200, {
      "Content-Type": "application/json"
  });

  var word_freq = {};
  result.forEach(function (content){
      var newcontent = content["keywords"] ? content["keywords"].replace(regex,",") : "";
      if(newcontent.length !== 0){
          var words = newcontent.split(",");
          words.forEach(function (word){
              word = word.toString();
              if(word.indexOf("/undefined/")==-1){
                word_freq[word] = (word_freq[word] +1 ) || 1;
              }
          });
      };
  });
  var final = [];
  for(var key in word_freq){
    if(key!=""){
      var tmp = {};
      tmp["name"] = key;
      tmp["value"] = word_freq[key]
      final.push(tmp)
    }
  }

  final.sort(function(a, b) {
      return b.value - a.value; // 按照value从大到小排序
  });
  var top300 = final.slice(0, 300); // 截取前300位数据
  response.write(JSON.stringify({message:'data',result:top300}));
  response.end();
  
  });
});

module.exports = router;

