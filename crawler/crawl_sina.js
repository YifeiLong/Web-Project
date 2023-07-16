var fs = require('fs');
var myRequest = require('request');
var myCheerio = require('cheerio');
var myIconv = require('iconv-lite');
require('date-utils');
var mysql = require('./mysql.js');

var source_name = "新浪娱乐";
var myEncoding = "utf-8";
// var seedURL = 'https://ent.sina.com.cn/';
// var seedURL = 'http://yue.sina.com.cn/';
// var seedURL = 'http://ent.sina.com.cn/xiju/';
// var seedURL = 'https://ent.sina.com.cn/zongyi/';
// var seedURL = 'https://ent.sina.com.cn/tv/';
// var seedURL = 'https://ent.sina.com.cn/korea/';
var seedURL = 'https://ent.sina.com.cn/hollywood/';

var seedURL_format = "$('a')";
var keywords_format = "$('meta[name=\"keywords\"]').eq(0).attr(\"content\")";
var title_format = "$('title').text()"; // 标题
var date_format = "$('meta[property=\"article:published_time\"]').eq(0).attr(\"content\")"; // 日期
var author_format = "$('meta[property=\"article:author\"]').eq(0).attr(\"content\")"; //编辑
var content_format = "$('meta[name=\"description\"]').eq(0).attr(\"content\")"; //文章

var reg1 = /\d{4}-\d{2}-\d{2}/;
var reg2 = /\/slide/;
var reg3 = /\/article/;
var url_reg = new RegExp(`(${reg1.source}|${reg2.source}|${reg3.source})`); // 用于匹配主页面中的新闻子页面的正则表达式

//防止网站屏蔽我们的爬虫
var headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'}

//request模块异步fetch url
function request(url, callback)
{
    var options =
        {
            url: url,
            encoding: null,
            //proxy: 'http://x.x.x.x:8080',
            headers: headers,
            timeout: 10000 //
        }
    myRequest(options, callback)
};

seedget();

function seedget()
{
    request(seedURL,
        function(err, res, body)//读取种子页面
        {
            //用iconv转换编码
            var html = myIconv.decode(body, myEncoding);
            //准备用cheerio解析html
            var $ = myCheerio.load(html, { decodeEntities: true });
            var seedurl_news;
            try
            {
                seedurl_news = eval(seedURL_format);
            }
            catch (e) { console.log('url列表所处的html块识别出错:' + e) };
            seedurl_news.each(
                function(i, e) //遍历种子页面里所有的a链接
                {
                    var myURL = "";
                    try
                    {//得到具体新闻url
                        var href = "";
                        href = $(e).attr("href");
                        if (href == undefined) return;
                        if (href.toLowerCase().indexOf('https://') >= 0) myURL = href; //https://开头的
                        else if (href.startsWith('//')) myURL = 'https:' + href; //  //开头的
                        else myURL = seedURL.substr(0, seedURL.lastIndexOf('/') + 1) + href; //其他
                    } catch (e) { console.log('识别种子页面中的新闻链接出错：' + e) }

                    if (!url_reg.test(myURL))
                    {
                        // console.log('不符合正则表达式'+myURL);
                        return; //检验是否符合新闻url的正则表达式
                    }

                    var fetch_url_Sql = 'select url from fetches where url=?';
                    var fetch_url_Sql_Params = [myURL];
                    mysql.query(fetch_url_Sql, fetch_url_Sql_Params,
                        function(qerr, vals, fields)
                        {
                            if (vals == null || vals.length == 0)
                                newsGet(myURL);
                            else
                                console.log('URL duplicate!');
                        });
                });
        });
};

function newsGet(myURL)
{ //读取新闻页面
    request(myURL,
        function(err, res, body)
        {
            try
            {
                if((typeof(body) == "undefined"))
                {
                    return;
                }

                var html_news = myIconv.decode(body, myEncoding); //用iconv转换编码
                if (!(typeof(html_news) == "undefined"))
                { // console.log(1);
                    var $ = myCheerio.load(html_news, { decodeEntities: true });
                    myhtml = html_news;
                }
                else {return;}
            }catch(e){console.log('读新闻页面并转码出错：' + e);}
            //用iconv转换编码
            var html_news = myIconv.decode(body, myEncoding);
            //准备用cheerio解析html_news
            var $ = myCheerio.load(html_news, { decodeEntities: true });
            myhtml = html_news;
            console.log("转码读取成功:" + myURL);
            //动态执行format字符串，构建json对象准备写入文件或数据库
            var fetch = {};

            fetch.url = myURL;

            fetch.source_name = source_name;

            fetch.source_encoding = myEncoding;

            fetch.title = "";
            if (title_format == "") fetch.title = "";
            else fetch.title = eval(title_format); //标题

            if (keywords_format == "") fetch.keywords = source_name; // 没有关键词就用sourcename
            else fetch.keywords = eval(keywords_format);

            if (!eval(author_format))
                fetch.author = source_name; //eval(author_format);  //作者
            else fetch.author = eval(author_format);

            fetch.publish_date = "";
            if (date_format == "") fetch.publish_date = "";
            else fetch.publish_date = eval(date_format);

            fetch.crawltime = new Date();

            fetch.content = "";
            if(content_format == "") fetch.content = "";
            else fetch.content = eval(content_format)


            var fetchAddSql = 'INSERT INTO fetches(url,source_name,source_encoding,title,keywords,author,publish_date,crawltime,content) VALUES(?,?,?,?,?,?,?,?,?)';
            var fetchAddSql_Params = [fetch.url, fetch.source_name, fetch.source_encoding,
                fetch.title, fetch.keywords, fetch.author, fetch.publish_date,
                fetch.crawltime.toFormat("YYYY-MM-DD HH24:MI:SS"), fetch.content];

            // console.log(fetchAddSql_Params);

            //执行sql，数据库中fetch表里的url属性是unique的，不会把重复的url内容写入数据库
            mysql.query(fetchAddSql, fetchAddSql_Params,
                function(qerr, vals, fields)
                {
                    if (qerr)
                    {
                        console.log(qerr);
                        console.log("fail");
                    }
                    else console.log("success");
                }); //mysql写入
        });
}