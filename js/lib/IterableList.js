
function IterableList() {

    var self = this;
    var head = null;
    var iterator = null;
    var last = null;

    self.add = function (data) {
        var node = new Node(data);

        if (head) {
            node.before = last;
            last.next = node;

        } else {
            node.before = null;
            head = node;
            iterator = head;

        }

        last = node;
    };

    self.addNode = function (node) {

        if (head) {
            node.before = last;
            last.next = node;
            
        } else {
            node.before = null;
            head = node;
            iterator = head;

        }
        
        node.next = null;
        last = node;

    };

    self.isEmpty = function () {
        return !head;
    };

    self.next = function () {
        var hasNext;

        if (iterator && iterator.next) {
            iterator = iterator.next;
            hasNext = true;
        } else {
            iterator = head;
            hasNext = false;
        }

        return hasNext;
    };

    self.before = function () {
        var hasBefore;

        if (iterator && iterator.before) {
            iterator = iterator.before;
            hasBefore = true;
        } else {
            iterator = last;
            hasBefore = false;
        }

        return hasBefore;
    };

    self.resetIterator = function () {
        iterator = head;
    };

    self.getNode = function () {
        var node = null;
        var before, next;

        if (iterator !== null) {
            node = iterator;
            before = iterator.before;
            next = iterator.next;

            //update node links
            before === null || (before.next = next);
            next === null || (next.before = before);

            //update extreme node
            iterator !== head || (head = next);
            iterator !== last || (last = before);

            //update iterator
            iterator = new Node(null, before, next);
        }

        return node;
    };

    self.get = function () {
        return iterator ? iterator.data : null;
    };

    self.moveNodeTo = function (list) {
        var node = null;
        !head || list.addNode(node = self.getNode());
        return node;
    };
    
    self.clear = function(){
        head = null;
        iterator = null;
        empty = true;
    };
    
    function Node(data, before, next) {
        this.data = data;
        this.next = next || null;
        this.before = before || null;
    }

    return self;
}