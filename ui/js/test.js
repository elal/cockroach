// Generated by tsc.
// source: cockroach/resource/us/ts/test/...
// DO NOT EDIT!
//
// Copyright 2015 The Cockroach Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied. See the License for the specific language governing
// permissions and limitations under the License. See the AUTHORS file
// for names of contributors.
//
// Authors: Bram Gruneir (bram+code@cockroachlabs.com)
//          Matt Tracy (matt@cockroachlabs.com)
//
var headerDescription = "This file is designed to add the header to the top of the combined js test file.";
// source: util/property.ts
// Author: Matt Tracy (matt@cockroachlabs.com)
var Utils;
(function (Utils) {
    "use strict";
    function Prop(initial) {
        var obj = initial;
        var epoch = 0;
        var propFn = function (value) {
            if (value === undefined) {
                return obj;
            }
            obj = value;
            epoch++;
            return obj;
        };
        propFn.Epoch = function () { return epoch; };
        propFn.Update = function () { epoch++; };
        return propFn;
    }
    Utils.Prop = Prop;
    function Computed() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var obj = null;
        var lastProcessedEpoch = -1;
        var fn = args.pop();
        var parentProps = args;
        var epochFn = function () {
            var sum = 0;
            parentProps.forEach(function (p) { return sum += p.Epoch(); });
            return sum;
        };
        var propFn = function (value) {
            var epoch = epochFn();
            if (epoch > lastProcessedEpoch) {
                var values = parentProps.map(function (p) { return p(); });
                obj = fn.apply(this, values);
                lastProcessedEpoch = epoch;
            }
            return obj;
        };
        propFn.Epoch = epochFn;
        return propFn;
    }
    Utils.Computed = Computed;
})(Utils || (Utils = {}));
/// <reference path="../typings/mithriljs/mithril.d.ts" />
/// <reference path="../util/property.ts" />
var Utils;
(function (Utils) {
    "use strict";
    var QueryCache = (function () {
        function QueryCache(_query, dontRefresh) {
            this._query = _query;
            this._result = Utils.Prop(null);
            this._error = Utils.Prop(null);
            this._inFlight = false;
            this.result = this._result;
            this.error = this._error;
            if (!dontRefresh) {
                this.refresh();
            }
        }
        QueryCache.prototype.refresh = function () {
            var _this = this;
            if (this._inFlight) {
                return;
            }
            this._inFlight = true;
            this._query().then(function (obj) {
                _this._error(null);
                _this._inFlight = false;
                return _this._result(obj);
            }, function (err) {
                _this._result(null);
                _this._inFlight = false;
                return _this._error(err);
            });
        };
        QueryCache.prototype.hasData = function () {
            return this.result.Epoch() > 0 || this.error.Epoch() > 0;
        };
        return QueryCache;
    })();
    Utils.QueryCache = QueryCache;
})(Utils || (Utils = {}));
/// <reference path="../typings/mithriljs/mithril.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
/// <reference path="../util/property.ts" />
/// <reference path="../util/querycache.ts" />
suite("Properties", function () {
    var assert = chai.assert;
    suite("Util.Prop", function () {
        var testProp;
        setup(function () {
            testProp = Utils.Prop("initial");
        });
        test("initial value is correct.", function () {
            assert.equal(testProp(), "initial");
            assert.equal(testProp.Epoch(), 0);
            assert.equal(testProp(), "initial");
            assert.equal(testProp.Epoch(), 0);
        });
        test("setting value works correctly.", function () {
            for (var i = 1; i < 3; i++) {
                var newVal = "new_" + i.toString();
                assert.equal(testProp(newVal), newVal);
                assert.equal(testProp(), newVal);
                assert.equal(testProp.Epoch(), i);
            }
        });
        test("Update() increases epoch.", function () {
            assert.equal(testProp(), "initial");
            assert.equal(testProp.Epoch(), 0);
            for (var i = 1; i < 3; i++) {
                testProp.Update();
                assert.equal(testProp(), "initial");
                assert.equal(testProp.Epoch(), i);
            }
        });
    });
    suite("Util.Computed", function () {
        suite("Single Parent", function () {
            var parent;
            var recomputeCount;
            var computed;
            var computedString = function (s, n) { return s + "+computed" + n.toString(); };
            setup(function () {
                parent = Utils.Prop("initial");
                recomputeCount = 0;
                computed = Utils.Computed(parent, function (s) {
                    recomputeCount++;
                    return computedString(s, recomputeCount);
                });
            });
            test("computed value is lazily computed.", function () {
                assert.equal(computed(), computedString("initial", 1));
                for (var i = 1; i < 3; i++) {
                    var newVal = "new_" + i.toString();
                    parent(newVal);
                    assert.equal(computed(), computedString(newVal, i + 1));
                    assert.equal(computed(), computedString(newVal, i + 1));
                }
            });
            test("computed value recomputes if parent epoch changes.", function () {
                assert.equal(computed(), computedString("initial", 1));
                for (var i = 1; i < 3; i++) {
                    parent.Update();
                    assert.equal(computed(), computedString("initial", i + 1));
                    assert.equal(computed(), computedString("initial", i + 1));
                }
            });
            test("computed epoch is always parent epoch.", function () {
                for (var i = 1; i < 3; i++) {
                    var newVal = "new_" + i.toString();
                    parent(newVal);
                    assert.equal(parent.Epoch(), i);
                    assert.equal(computed.Epoch(), parent.Epoch());
                }
            });
            test("computed property can depend on another computed property", function () {
                var computed2 = Utils.Computed(computed, function (s) { return s + "+recomputed"; });
                assert.equal(computed2(), "initial+computed1+recomputed");
                parent("newvalue");
                assert.equal(computed2(), "newvalue+computed2+recomputed");
            });
        });
        suite("Multi-Parent", function () {
            var parents;
            var recomputeCount;
            var computed;
            var computedString = function (s1, s2, s3, s4, n) {
                return [s1, s2, s3].join(", ") + " and " + s4 + "(" + n + ")";
            };
            setup(function () {
                parents = [
                    Utils.Prop("Leonardo"),
                    Utils.Prop("Donatello"),
                    Utils.Prop("Raphael"),
                    Utils.Prop("Michaelangelo")
                ];
                recomputeCount = 0;
                computed = Utils.Computed(parents[0], parents[1], parents[2], parents[3], function (s1, s2, s3, s4) {
                    recomputeCount++;
                    return computedString(s1, s2, s3, s4, recomputeCount);
                });
            });
            test("computed value is lazily recomputed.", function () {
                for (var i = 1; i < 3; i++) {
                    parents.forEach(function (p) {
                        p(p() + "_" + i.toString());
                        assert.equal(p.Epoch(), i);
                    });
                    assert.equal(computed(), computedString(parents[0](), parents[1](), parents[2](), parents[3](), i));
                    assert.equal(computed(), computedString(parents[0](), parents[1](), parents[2](), parents[3](), i));
                }
                assert.equal(computed(), "Leonardo_1_2, Donatello_1_2, Raphael_1_2 and Michaelangelo_1_2(2)");
            });
            test("computed value is recomputed if only one parent changes.", function () {
                for (var i = 1; i < 3; i++) {
                    parents[0](parents[0]() + "_" + i.toString());
                    assert.equal(computed(), computedString(parents[0](), parents[1](), parents[2](), parents[3](), i));
                    assert.equal(computed(), computedString(parents[0](), parents[1](), parents[2](), parents[3](), i));
                }
                assert.equal(computed(), "Leonardo_1_2, Donatello, Raphael and Michaelangelo(2)");
            });
            test("computed epoch is always sum of parent epochs.", function () {
                for (var i = 1; i < 3; i++) {
                    parents.forEach(function (p) {
                        p(p() + "_" + i.toString());
                        assert.equal(p.Epoch(), i);
                    });
                    assert.equal(computed.Epoch(), parents[0].Epoch() * parents.length);
                }
            });
            test("computed property can depend on multiple computed properties.", function () {
                var parentA = Utils.Prop("A_1");
                var parentB = Utils.Prop("B_1");
                var computedA = Utils.Computed(parentA, function (s) { return "(" + s + ")"; });
                var computedB = Utils.Computed(parentB, function (s) { return "(" + s + ")"; });
                var computedFinal = Utils.Computed(computedA, computedB, function (a, b) { return [a, b].join(":"); });
                assert.equal(computedFinal(), "(A_1):(B_1)");
                assert.equal(computedA.Epoch(), 0);
                assert.equal(computedB.Epoch(), 0);
                assert.equal(computedFinal.Epoch(), 0);
                parentA("A_2");
                assert.equal(computedFinal(), "(A_2):(B_1)");
                assert.equal(computedA.Epoch(), 1);
                assert.equal(computedB.Epoch(), 0);
                assert.equal(computedFinal.Epoch(), 1);
                parentB("B_2");
                assert.equal(computedFinal(), "(A_2):(B_2)");
                assert.equal(computedA.Epoch(), 1);
                assert.equal(computedB.Epoch(), 1);
                assert.equal(computedFinal.Epoch(), 2);
            });
        });
    });
});
suite("QueryCache", function () {
    var assert = chai.assert;
    var activePromise;
    var promiseFn = function () {
        activePromise(m.deferred());
        return activePromise().promise;
    };
    var cache;
    setup(function () {
        activePromise = Utils.Prop(null);
        cache = new Utils.QueryCache(promiseFn);
    });
    test("Is Initially empty.", function () {
        assert.isFalse(cache.hasData(), "cache should initially be empty");
        assert.isNull(cache.result(), "result was not empty");
        assert.isNull(cache.error(), "error was not initially empty");
    });
    test("Caches one value or error at a time.", function () {
        cache.refresh();
        activePromise().resolve("resolved");
        assert.isTrue(cache.hasData(), "cache should have value");
        assert.equal(cache.result(), "resolved");
        assert.isNull(cache.error(), "error should be empty after result.");
        cache.refresh();
        activePromise().reject(new Error("error"));
        assert.isTrue(cache.hasData(), "cache should have value");
        assert.isNull(cache.result(), "result should be null after error");
        assert.deepEqual(cache.error(), new Error("error"));
        cache.refresh();
        activePromise().resolve("resolved again");
        assert.isTrue(cache.hasData(), "cache should have value");
        assert.equal(cache.result(), "resolved again");
        assert.isNull(cache.error(), "error should be empty after result.");
    });
    test("Cached value not overwritten until next promise resolved.", function () {
        cache.refresh();
        activePromise().resolve("resolved");
        assert.equal(cache.result(), "resolved");
        cache.refresh();
        assert.equal(cache.result(), "resolved");
        activePromise().resolve("resolved again");
        assert.equal(cache.result(), "resolved again");
    });
    test("Call to refresh is no-op if request is already in flight.", function () {
        cache.refresh();
        activePromise().resolve("resolved");
        assert.equal(cache.result(), "resolved");
        cache.refresh();
        cache.refresh();
        cache.refresh();
        activePromise().resolve("resolved again");
        assert.equal(cache.result(), "resolved again");
        assert.equal(activePromise.Epoch(), 2, "redundant refreshes should not have resulted in additional promises");
    });
});
// source: components/table.ts
/// <reference path="../typings/mithriljs/mithril.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="../util/property.ts" />
// Author: Matt Tracy (matt@cockroachlabs.com)
var Components;
(function (Components) {
    "use strict";
    var Table;
    (function (Table) {
        var Controller = (function () {
            function Controller(data) {
                this._sortColumn = Utils.Prop(null);
                this._sortAscend = Utils.Prop(false);
                this.data = data;
                this.sortedRows = Utils.Computed(data.rows, this._sortColumn, this._sortAscend, function (rows, sortCol, asc) {
                    var result = _(rows);
                    if (sortCol && sortCol.sortable) {
                        if (sortCol.sortValue) {
                            result = result.sortBy(sortCol.sortValue);
                        }
                        else {
                            result = result.sortBy(sortCol.view);
                        }
                        if (asc) {
                            result = result.reverse();
                        }
                    }
                    return result.value();
                });
            }
            ;
            Controller.prototype.SetSortColumn = function (col) {
                if (!col.sortable) {
                    return;
                }
                if (this._sortColumn() !== col) {
                    this._sortColumn(col);
                    this._sortAscend(false);
                }
                else {
                    this._sortAscend(!this._sortAscend());
                }
            };
            Controller.prototype.IsSortColumn = function (col) {
                return this._sortColumn() === col;
            };
            Controller.prototype.RenderHeaders = function () {
                var _this = this;
                var cols = this.data.columns();
                var sortClass = "sorted" + (this._sortAscend() ? " ascending" : "");
                var renderedCols = cols.map(function (col) {
                    return m("th", {
                        onclick: function (e) { return _this.SetSortColumn(col); },
                        className: _this.IsSortColumn(col) ? sortClass : null
                    }, col.title);
                });
                return m("tr", renderedCols);
            };
            Controller.prototype.RenderRows = function () {
                var _this = this;
                var cols = this.data.columns();
                var rows = this.sortedRows();
                var renderedRows = _.map(rows, function (row) {
                    var renderedCols = cols.map(function (col) {
                        return m("td", {
                            className: _this.IsSortColumn(col) ? "sorted" : null
                        }, col.view(row));
                    });
                    return m("tr", renderedCols);
                });
                return renderedRows;
            };
            return Controller;
        })();
        function controller(data) {
            return new Controller(data);
        }
        Table.controller = controller;
        function view(ctrl) {
            return m("table", [
                ctrl.RenderHeaders(),
                ctrl.RenderRows(),
            ]);
        }
        Table.view = view;
        function create(data) {
            return m.component(Table, data);
        }
        Table.create = create;
    })(Table = Components.Table || (Components.Table = {}));
})(Components || (Components = {}));
/// <reference path="../typings/mithriljs/mithril.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
/// <reference path="../components/table.ts" />
/// <reference path="../util/property.ts" />
var TestData;
(function (TestData) {
    "use strict";
})(TestData || (TestData = {}));
var TestTable;
(function (TestTable) {
    "use strict";
    var Table = Components.Table;
    suite("Table Component", function () {
        var columns = [
            {
                title: "ID Column",
                view: function (r) { return m("span.id", r.id); },
                sortable: true,
                sortValue: function (r) { return r.id; }
            },
            {
                title: "Title",
                view: function (r) { return r.title; },
                sortable: false
            },
            {
                title: "Value",
                view: function (r) { return m("span.value", r.value); },
                sortable: true,
                sortValue: function (r) { return r.value; }
            }
        ];
        var data = {
            columns: Utils.Prop(columns),
            rows: Utils.Prop([
                {
                    id: 2,
                    title: "CCC",
                    value: 60
                },
                {
                    id: 1,
                    title: "AAA",
                    value: 40
                },
                {
                    id: 3,
                    title: "BBB",
                    value: 10
                },
            ])
        };
        test("Sorts data correctly", function () {
            var table = Table.controller(data);
            chai.assert.deepEqual(_.pluck(table.sortedRows(), "id"), [2, 1, 3]);
            table.SetSortColumn(columns[0]);
            chai.assert.deepEqual(_.pluck(table.sortedRows(), "id"), [1, 2, 3]);
            table.SetSortColumn(columns[0]);
            chai.assert.deepEqual(_.pluck(table.sortedRows(), "id"), [3, 2, 1]);
            table.SetSortColumn(columns[2]);
            chai.assert.deepEqual(_.pluck(table.sortedRows(), "id"), [3, 1, 2]);
            table.SetSortColumn(columns[2]);
            chai.assert.deepEqual(_.pluck(table.sortedRows(), "id"), [2, 1, 3]);
            table.SetSortColumn(columns[1]);
            chai.assert.deepEqual(_.pluck(table.sortedRows(), "id"), [2, 1, 3]);
            table.SetSortColumn(columns[1]);
            chai.assert.deepEqual(_.pluck(table.sortedRows(), "id"), [2, 1, 3]);
        });
    });
})(TestTable || (TestTable = {}));
