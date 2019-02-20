var JqgridTempl = {};

(function ($,module) {

    if (!!!$) {
        alert('请引入query.js');
        return false;
    }

    var _calcWidth = function (container,widthOffset) {
        if (!!container) return $("." + container).width() - widthOffset;
        var winWidth = $(window).width();
        return winWidth;
    };

    var _calcHeight = function (calcHeightStatus,containerHeight,heightOffset) {
        var winHeight = 0;
        if (calcHeightStatus) {
            winHeight = !!containerHeight ? $("." + containerHeight).height() - 155 : $(window).height() - 285;
        } else {
            winHeight = $("." + containerHeight).height() - heightOffset;
        }
        return winHeight;
    };

    var _repairCheckbox = function  (dom,func){
        // 并没有渲染不存在一个空的tr，从大于0开始
        var trCount = dom.find("tr:gt(0):visible").length;
        // 获取选中的行
        var checkedLength = dom.find("tr.ui-state-highlight:visible").length;
        if (trCount === checkedLength) {
            var checkId = "cb_" + dom.attr("id");
            $("#" + checkId).prop("checked", "true");
        }

        if(func)  (func)();
    };

    /**
     * JqgridTable对象构造函数
     * @param options jqgrid的初始化参数
     * @returns {JqgridTable}
     * @constructor
     */
    function JqgridTable(options) {

        var _defaultConfig;

        if (options.dataType === 'local') {
            _defaultConfig = {
                datatype: 'local',
                multiboxonly: false,
                multiselect: true,		//是否多选
                pager: false,
                rowNum: -1
            }
        } else {

            // 默认配置参数
            _defaultConfig = {

                forceFit: true,
                datatype: 'json',
                mtype: 'POST',		// 请求方法是GET或者POST

                /* 定义后台分页的名字 */
                jsonReader: {
                    root: "rows",    		// 返回的数组集合
                    page: "currentPage",    // 当前页数
                    total: "totalPage",  	// 总页数
                    records: "count", 	    // 总行数
                    repeatitems: false 	    // 指明每行的数据是可以重复的，如果设为false，则会从返回的数据中按名字来搜索元素
                },
                pager: true,

                /* 多选设置 */
                multiselect: true,		  // 是否多选
                autoencode: true,		  // 对url进行编码

                /* 样式设置 */
                autoWidth: true,          // 自动宽

                hoverrows: true,          // 当为false时mouse hovering会被禁用

                /* 前端排序功能 */
                loadonce: false,          // ture，数据只从服务器端抓取一次，之后所有操作都是在客户端执行，翻页功能会被禁用
                sortable: true,

                /* 加载数据的模式 */
                scroll: false,  		  // 创建一个动态滚动的表格。true，翻页栏被禁用，使用垂直滚动条加载数据，且在首次访问服务器端时将加载所有数据到客户端。当此参数为数字时，表格只控制可见的几行，所有数据都在这几行中加载

                /* 分页设置 */

                rowNum: 20,				  // 默认每页20条
                rowList: [20, 50, 100, 200, 500, 1000, 2000, 3000],
                viewrecords: true, 		  // 是否显示总记录数

                /* 翻页默认带参数 */
                prmNames: {
                    page: 'currentPage',  // 后台分页前台排序没有这项
                    rows: 'pageSize',     // rowNum rowList  -1的时候是1万
                    sort: 'orderField',
                    order: 'orderType'
                },

                /* fixed 解决红框报错问题 */
                loadError: function (xhr, status, error) {
                    alert('解决红框问题')
                    // if (!!xhr.responseText && xhr.responseText.indexOf("kaptcha") > 0) {
                    //     window.location.href = '../../background/login.html';
                    // }
                    // // TODO 国际化jqgrid加载失败
                    // layer.message(status + " loading data of " + $(this).attr("id") + " : " + error);
                },

                loadComplete: function (data) {
                    // if(data.records==0){
                    //     alert("无数据")
                    // }
                },

                // 防止出错(3个函数)
                beforeSelectRow: function (rowid, e) {
                },
                onSortCol: function (index, iCol, sortorder) {
                },
                onPaging: function (btn) {
                }

            };
        }

        this.config = $.extend({}, _defaultConfig, options);

        //保存最后一行的tr id的数字 ，jqgrid的tr id组成是jqg+number
        this.idCount = -1;

        return this;

    }

    /**
     * 初始化表格
     * @param initConfig 初始化参数
     * initConfig{
     *      id : table容器id
     *      container : table 的父容器
     *      containerHeight：table 的父容器的高
     *      calcHeightStatus：是否计算父容器高度
     *
     *      gridWidth : 表格宽度
     *      gridHeight ： 表格高度
     *      hiddenCheckbox ： 隐藏多选框
     *      overscoll : 设置滚动条
     *      thconfigs : {
     *         textalign : 表头文字位置
     *         cbalgin ： 表头checkbox位置
     *      }
     *
     *      heightOffset、widthOffset：table距离父容器边距
     *      option：jqgrid的初始化参数
     * }
     *
     * @returns {JqgridTable}
     */
    JqgridTable.prototype.initGrid = function (initConfig) {

        var columnChooser = !!initConfig.columnChooser ? initConfig.columnChooser : false;
        var id = initConfig.id;
        var container = initConfig.container;
        var containerHeight = initConfig.containerHeight;
        var calcHeightStatus = initConfig.calcHeightStatus;
        var heightOffset = !!initConfig.heightOffset ? initConfig.heightOffset : 60;
        var widthOffset = !!initConfig.widthOffset ? initConfig.widthOffset : 18;

        // 若是有其他参数
        this.config = !!initConfig.option ? ($.extend({}, this.config, initConfig.option)) : this.config;

        // 表格宽高设置
        this.config.width = _calcWidth(container,widthOffset);
        this.config.height = _calcHeight(calcHeightStatus,containerHeight,heightOffset);

        /*fixed: 修复jqgrid全选bug */
        var onSelectRowTemp = this.config.onSelectRow;
        this.config.onSelectRow = function (rowId, status) {
            _repairCheckbox(dom,onSelectRowTemp);
        };

        /* 初始化出表格 */
        $('#' + id).jqGrid(this.config);

        // 分页栏按钮
        if (columnChooser) {
            $('#' + id).jqGrid('navGrid', this.config.pager, {
                add: false,
                edit: false,
                del: false,
                search: false,
                refresh: false
            });
            $('#' + id).jqGrid('navButtonAdd', this.config.pager, {
                caption: 'Columns',
                title: 'Columns',
                // caption: jQuery.i18n.prop('user.List'),
                // title: jQuery.i18n.prop('user.List'),
                onClickButton: function () {
                    $('#' + id).jqGrid('columnChooser');
                }
            })
        }

        // 设置宽度自适应
        if(initConfig.gridWidth){
            $('#' + id).setGridWidth(initConfig.gridWidth);
        }

        // 设置高度自适应
        if (initConfig.gridHeight) {
            $('#' + id).setGridHeight(initConfig.gridHeight)
        }

        // 设置滚动条
        if (initConfig.overscoll) {
            $('#' + id).find("ui-jqgrid .ui-jqgrid-bdiv").css("overflow", "auto");
        }

        // 隐藏多选框
        if (initConfig.hiddenCheckbox) {
            $('#' + id).jqGrid("hideCol", 'cb');
        }

        // 设置表头
        if (initConfig.thconfigs) {
            var thconfigs = initConfig.thconfigs;
            if (thconfigs.textalign) { // 设置表头文本位置
                $(".ui-jqgrid-labels th div").css("text-align", thconfigs.textalign);
            }
            if (thconfigs.cbalgin) {  // 设置表头checkbox的位置
                //eg:表格的id=jqgh_subscribermemTemplateList_cb
                var selector = '.ui-jqgrid-labels th div#jqgh_' + id + '_cb';
                $(selector).css("text-align", thconfigs.cbalgin);
            }
        }

        this.id = id;

        return this;
    };

    /**
     * 重置表格宽高
     */
    JqgridTable.prototype.resize = function () {
        $('#' + (this.id)).setGridWidth(this.config.width);
        $('#' + (this.id)).setGridHeight(this.config.height);
    };

    /**
     * 刷新表格
     * @param cOptions
     * {
     *     data  : datatype='local' 时的 data数据
     *     option : jqgrid初始化参数
     * }
     */
    JqgridTable.prototype.tableRefresh = function (cOptions) {
        var id = this.id;
        //清空表格
        this.clearTableData();

        var _defaultConfig = {};

        if (this.config.datatype === 'json' && this.config.url) {
            _defaultConfig = {  // 重新加载数据
                url: this.config.url,
                datatype: this.config.datatype,// 返回的数据格式
                mtype: this.config.mtype// 请求方法是GET或者POST
            };

        } else if (this.config.datatype === 'local') {
            if(cOptions.data[0]){
                _defaultConfig = {  // 重新加载数据
                    datatype:'local',// 返回的数据格式
                    data : configs.data// 请求方法是GET或者POST
                };
            }else{
                var arr = [];
                for(var prop in cOptions.data){
                    arr.push(cOptions.data[prop]);
                }
                _defaultConfig = {  // 重新加载数据
                    datatype:'local',// 返回的数据格式
                    data : arr,// 请求方法是GET或者POST
                    rowNum:-1
                };
            }
        }
        var config = $.extend({},_defaultConfig, cOptions.option || {});

        $('#' + id).jqGrid('setGridParam', config).trigger("reloadGrid");
    };

    /**
     * 当前页面删除选中行,返回删除的数据
     * @param configs   其他需要传递的参数
     * @returns {Array} 删除的数据
     */
    JqgridTable.prototype.pageDelRow = function (configs) {
        var dom = $("#" + (this.id));
        var rowIds = JqgridTable.getSelectedRowIds(dom);
        var selectRowData = JqgridTable.getSelectRowData(dom);
        if (rowIds || rowIds.length > 0) {
            $(rowIds).each(function (i, n) {
                // 删除行
                dom.jqGrid('delRowData', n);
            });

            // 记录id变化
            this.idCount = this.idCount - rowIds.length;
        }
        // 清空选择
        dom.jqGrid('resetSelection');

        return selectRowData;
    };

    /**
     * 清空表格数据
     */
    JqgridTable.prototype.clearTableData = function () {
        var id = this.id;
        $('#' + id).jqGrid('clearGridData');
    };

    /**
     * 再原有基础上添加表格数据
     * @param data_rows [{},{}] or 非数字下标形式数组
     * @param hiddenField [field,field]
     */
    JqgridTable.prototype.addRowData = function(data_rows,hiddenField){

        var dom = $("#" + (this.id));

        if (data_rows && data_rows) {
            if(this.idCount == -1){
                this.idCount = 0;
            }

            var $id;

            if(data_rows.length > 0){  //数字下标
                for (var i = 0; i < data_rows.length; i++) {
                    // 固定形式的rowId -- > tr id
                    dom.jqGrid('addRowData', 'jqg' + (this.idCount + 1), data_rows[i]);

                    $id = dom.find('#jqg' + (this.idCount + 1));

                    // 设置隐藏数据tr
                    JqgridTable.setHiddenFieldInTr($id, data_rows[i], hiddenField);

                    // 记录id目前编号
                    this.idCount = this.idCount + 1;
                }
            }else{
                // 非数字下标
                for(var index in data_rows){
                    // 固定形式的rowId -- > tr id
                    dom.jqGrid('addRowData', 'jqg' + (this.idCount + 1), data_rows[index]);
                    $id = dom.find('#jqg' + (this.idCount + 1));

                    // 设置隐藏数据tr
                    JqgridTable.setHiddenFieldInTr($id, data_rows[index], hiddenField);

                    // 记录id目前编号
                    this.idCount = this.idCount + 1;
                }
            }
        }
    };

    /**
     * 隐藏行
     * @param colName
     */
    JqgridTable.prototype.hideCol = function (colName) {
        var id = this.id;
        $('#' + id).setGridParam().hideCol(colName);
    };

    /**
     * 当前页面查询
     * @param keyWord
     */
    JqgridTable.pageSearch = function (keyWord, dom) {
        // 清空选择
        dom.jqGrid('resetSelection');
        dom.find("tr:gt(0)").show();
        if (!!!keyWord) {
            return;
        } else{
            dom.find("tr:gt(0)").hide();
            dom.find("td:gt(0):contains('"+keyWord+"')").parent().show();
        }
    };

    /**
     * 清空选择
     * @param dom
     */
    JqgridTable.clearSelected = function(dom){
        dom.jqGrid('resetSelection');
    };

    /**
     * 删除行（以隐藏的方式）
     * @param dom
     * @returns {Array} 删除的数据
     */
    JqgridTable.pageDelRow = function(dom){
        var data = [];
        var ids = dom.jqGrid("getGridParam", 'selarrrow');
        for (var i = 0; i < ids.length; i++) {
            var _$midJq = $(dom.jqGrid("getGridRowById", ids[i]));
            if(_$midJq.is(":visible")){
                data.push(dom.jqGrid("getRowData", ids[i]));
            }
        }
        return data;
    };

    /**
     * 当前页面删除选中行
     * @param dom
     * @param configs 其他需要传递的参数
     */
    JqgridTable.pageDelRow2 = function (dom, configs) {
        var rowIds = JqgridTable.getSelectedRowIds(dom);
        if (rowIds || rowIds.length > 0) {
            $(rowIds).each(function (i, n) {
                // 删除行
                dom.jqGrid('delRowData', n);
            });
        }
        // 清空选择
        dom.jqGrid('resetSelection');
    };

    /**
     * 获取选中的行的id，返回为数组
     * @param dom
     */
    JqgridTable.getSelectedRowIds = function (dom) {
        return dom.jqGrid('getGridParam', 'selarrrow');
    };

    /**
     * 获取选中行的数据
     * @param dom
     * @returns {Array}
     */
    JqgridTable.getSelectRowData = function (dom) {
        var rowIds = JqgridTable.getSelectedRowIds(dom);
        var dataObjArrs = [];
        if (rowIds && rowIds.length > 0) {
            $(rowIds).each(function (i, n) {
                var obj = dom.jqGrid('getRowData', n);
                dataObjArrs.push(obj);
            });
        }
        return dataObjArrs;
    };

    /**
     * 获取所有的行
     * @param dom
     */
    JqgridTable.getAllRowIds = function (dom) {
        return dom.jqGrid('getDataIDs');
    };

    /**
     * 获取表格所有行的数据
     * @param dom
     */
    JqgridTable.getAllRowData = function (dom) {
        var rowIds = JqgridTable.getAllRowIds(dom);
        var dataObjArrs = [];
        if (rowIds && rowIds.length > 0) {
            $(rowIds).each(function (i, n) {
                var obj = dom.jqGrid('getRowData', n);
                dataObjArrs.push(obj);
            });
        }
        return dataObjArrs;
    };

    /**
     * 根据rowIds获取换数据
     * @param dom
     * @param rowIds
     * @returns {Array}
     */
    JqgridTable.getRowDataByRowIds = function (dom, rowIds) {
        var dataObjArrs = [];
        $(rowIds).each(function (i, n) {
            var obj = dom.jqGrid('getRowData', n);
            dataObjArrs.push(obj);
        });

        return dataObjArrs;
    };

    /**
     * 设置所有行的隐藏数据到tr属性上
     *
     * @param dom  表格id对应的$(dom)
     * @param arr  每行数据[{},{}]
     * @param {arr} hiddenFields 需要隐藏的字段
     *
     * 说明：当设置到tr上时，使tr.attr等于json属性名
     * 要注意的一点是，tr的属性会将自动大写转换为小写
     *
     * eg:
     *  arr:[{GsiPort:1,MemType:1}]
     *  hiddenFields ['GsiPort', 'MemType']
     *
     * 设置完成的形式是：
     * <tr gsiPort='1' memtype = '1'></tr>
     *
     */
    JqgridTable.setHiddenFieldInTrs = function (dom, arr, hiddenField) {
        var trs = dom.find("tr:gt(0)");
        if(arr && arr.length > 0){
            if(arr[0]){
                $.each(trs, function (i, n) {
                    if (i < arr.length) {
                        var record = arr[i];
                        for (key in hiddenField) {
                            var field = hiddenField[key];
                            $(n).attr(field, record[field]);
                        }
                    }
                });
            }else{
                var count = 0;
                for(var index in arr){
                    if (count < arr.length) {
                        var record = arr[index];
                        for (key2 in hiddenField) {
                            var field = hiddenField[key2];
                            $(trs.get(count)).attr(field, record[field]);
                        }
                    }
                    count ++;
                }
            }
        }
    };

    /**
     * 设置单行的隐藏数据到tr属性上
     * @param $id
     * @param row_data    当前tr的id
     * @param hiddenField 当前行的数据{}
     */
    JqgridTable.setHiddenFieldInTr = function ($id, row_data, hiddenField) {
        // json对应的成员属性
        for (key in hiddenField) {
            var field = hiddenField[key];
            $id.attr(field, row_data[field]);
        }
    };

    /**
     *
     * 获取Tr上隐藏属性的值
     *   type：
     *          select ：获取选中行
     *          all : 获取所有行
     *   attrs(Array): 选属性
     * @param dom
     * @param configs
     * @returns {*}
     *
     * eg:
     * configs:{
     *     type:'select',
     *     attrs: ['GsiPort', 'MemType'],
     * }
     */
    JqgridTable.getTrHideVal = function (dom, configs) {
        // 返回的数据集
        var rowDatas = new Array();
        if (configs && configs.type) {
            var type = configs.type;
            if (type == 'select' || type == 'all') {
                var rowIds;
                if (type == 'select') { // 获取选中行
                    rowIds = JqgridTable.getSelectedRowIds(dom);
                } else if (type == 'all') {
                    rowIds = JqgridTable.getAllRowIds(dom);
                }
                if (rowIds && rowIds.length > 0) {
                    $(rowIds).each(function (i, n) {
                        var rowData = {};
                        var attrs = configs.attrs;
                        for (var j = 0; j < attrs.length; j++) {
                            //说明：html将所有的属性变成小写
                            var trAttr = attrs[j].toLowerCase();
                            rowData[attrs[j]] = dom.find("tr#" + n).attr(trAttr);
                        }
                        rowDatas.push(rowData);
                    })
                }
            }
        } else {
            alert('参数设置有问题');
        }
        return rowDatas;
    };

    module.JqgridTable = JqgridTable;

})($,JqgridTempl || {});
