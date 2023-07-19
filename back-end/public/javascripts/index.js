var app = angular.module('index', []);
app.controller('index_Ctrl', function ($scope, $http, $timeout) {
    // 控制查询页面是否显示（导航栏点击新闻搜索）
    $scope.showSearch = function () {
        $scope.isShow = true;
        $scope.showType = "search.html"
        $scope.isshowresult = false;

        // 再次回到查询页面时，表单里要保证都空的
        $scope.title=undefined;
        $scope.source=undefined;
        $scope.sorted=undefined;
    };

    // 导航栏点击折线图
    $scope.showLine = function () {
        $scope.showType = "line.html"
        $scope.isShow = true;
        $scope.isshowresult = false;

        // 再次回到查询页面时，表单里要保证都空的
        $scope.title=undefined;
    };

    // 导航栏点击柱状图
    $scope.showHis = function () {
        $scope.showType = "histogram.html"
        $scope.isShow = true;
        $scope.isshowresult = false;

        // 再次回到查询页面时，表单里要保证都空的
        $scope.title=undefined;
    };

    // 查询页面
    // 查询数据
    $scope.search = function () {
        //提取参数
        var title = $scope.title;
        var source = $scope.source;
        var sorted =  $scope.sorted;
        var myurl = `/search?title=${title}&source=${source}&sorted=${sorted}`;
        //请求路由
        $http.get(myurl).then(
            function (res) {
                if(res.data.message=='data'){
                    $scope.isshowresult = true; //显示表格查询结果
                    $scope.initPageSort(res.data.result)
                }else {
                    window.location.href=res.data.result;
                }


            },function (err) {
                $scope.msg = err.data;
            });
    };
    
    // 分页
    $scope.initPageSort=function(item){
        $scope.pageSize=5;　　//每页显示的数据量，可以随意更改
        $scope.selPage = 1;
        $scope.data = item;
        $scope.pages = Math.ceil($scope.data.length / $scope.pageSize); //分页数
        $scope.pageList = [];//最多显示5页，后面6页之后不会全部列出页码来
        $scope.index = 1;
        
        var len = $scope.pages> 5 ? 5:$scope.pages;
        $scope.pageList = Array.from({length: len}, (x,i) => i+1);

        //设置表格数据源(分页)
        $scope.items = $scope.data.slice(0, $scope.pageSize);

    };

    // 打印当前选中页
    $scope.selectPage = function (page) {
        //不能小于1大于最大（第一页不会有前一页，最后一页不会有后一页）
        if (page < 1 || page > $scope.pages) return;
        //最多显示分页数5，开始分页转换
        var pageList = [];
        if(page>2){
            for (var i = page-2; i <= $scope.pages && i < page+3; i++) {
                pageList.push(i);
            }
        }else {
            for (var i = page; i <= $scope.pages && i < page+5; i++) {
                pageList.push(i);
            }
        }

        $scope.index =(page-1)*$scope.pageSize+1;
        $scope.pageList = pageList;
        $scope.selPage = page;
        $scope.items = $scope.data.slice(($scope.pageSize * (page - 1)), (page * $scope.pageSize));//通过当前页数筛选出表格当前显示数据
        console.log("选择的页：" + page);
    };
    //设置当前选中页样式
    $scope.isActivePage = function (page) {
        return $scope.selPage == page;
    };
    //上一页
    $scope.Previous = function () {
        $scope.selectPage($scope.selPage - 1);
    };
    //下一页
    $scope.Next = function () {
        $scope.selectPage($scope.selPage + 1);
    };


    // 时间热度分析
    $scope.line = function () {
        var keyword = $scope.keyword;
        // $scope.isshowresult = true;
        $scope.isShow = false;
        var myurl = `/line?keyword=${keyword}`;
        $http.get(myurl).then(
            function (res) {
                console.log("line chart");
                var myChart = echarts.init(document.getElementById("main1"));
                option = {
                    title: {
                        text: "时间热度分析图："+keyword
                    },
                    xAxis: {
                        type: 'category',
                        data:res.data.time,
                        show: true,
                    },
                    yAxis: {
                        type: 'value'
                    },
                    series: [{
                        data:res.data.num,
                        type: 'line',
                        itemStyle: {normal: {label: {show: true}}}
                    }],
                };

                if (option && typeof option === "object") {
                    myChart.setOption(option, true);
                }
    
            });
    };

    $scope.histogram = function () {
        var keyword = $scope.keyword;
        // $scope.isshowresult = true;
        $scope.isShow = false;
        var myurl = `/histogram?keyword=${keyword}`;

        $http.get(myurl)
            .then(
                function (res) {

                    var myChart = echarts.init(document.getElementById('main1'));

                    var option = {
                        title: {
                            text: "时间热度分析图："+keyword
                        },
                        tooltip: {},
                        legend: {
                            data: ['新闻数目']
                        },
                        xAxis: {
                            type: 'category',
                            name: '时间',
                            show: true,
                            data: res.data.time,
                            axisLabel: {
                                rotate: 40,
                                interval :0
                            }
                        },

                        yAxis: {
                            type: 'value',
                            name: '数目',
                            // min: 0,
                            // max: 100,
                            // interval:10,
                            axisLabel: {
                                formatter: '{value}'
                            }
                        },
                        series: [{
                            name: '数目',
                            type: 'bar',

                            itemStyle: {
                                normal: {
                                    color: function(params) {
                                        var colorList = [
                                            '#F6E3CE','#F2F5A9','#BEF781','#A9F5D0',

                                            '#81F7F3','#81DAF53','#5882FA','#0101DF','#D358F7',

                                            '#F781D8','#FA58AC','#FA5882','#D8D8D8','#848484'
                                        ];
                                        return colorList[params.dataIndex]
                                    },

                                    label: {
                                        show: true,
                                        position: 'top',
                                        formatter: '{c}'
                                    }
                                }
                            },
                            barWidth: 40,
                            data: res.data.num
                        }]
                    };
                    myChart.setOption(option);
                    // }
                },
            
                function (err) {
                    $scope.msg = err.data;
                });
   }

    $scope.wordcloud = function () {
        $scope.isShow = false;
        $http.get("/wordcloud").then(
            function (res) {
                var chart = echarts.init(document.getElementById('main1'));

                var maskImage = new Image();
                maskImage.src = './images/wordcloud1.png';

                var option = {
                    title: {
                        text: '新闻关键词词云图'
                    },
                    tooltip: {},
                    series: [{
                        type: 'wordCloud',
                        sizeRange: [12, 60],
                        rotationRange: [-30, 30],
                        rotationStep: 45,
                        gridSize: 2,
                        shape: 'circle',
                        maskImage: maskImage,
                        drawOutOfBound: false,
                        textStyle: {
                            fontFamily: 'sans-serif',
                            fontWeight: 'bold',
                            color: function () {
                                // Random color
                                return 'rgb(' + [
                                    Math.round(Math.random() * 160),
                                    Math.round(Math.random() * 160),
                                    Math.round(Math.random() * 160)
                                ].join(',') + ')';
                            },
                            emphasis: {
                                shadowBlur: 10,
                                shadowColor: '#555'
                            }
                        },
                        data: res.data.result
                    }]
                };
                // chart.clear();
                chart.setOption(option);
                console.log(res.data.result);
            },
            function (err) {
                $scope.msg = err.data;
            }
            );
    }

    $scope.openLink = function(url) {
        window.open(url, '_blank'); // 在新的页签中打开链接
    };
});
