class Auction {
    constructor({id, title, current_highest_bid, version}){
        this.id = id;
        this.title = title;
        this.current_highest_bid = current_highest_bid;
        this.version = version
    }
}

class Bid {
    constructor({id, auction_id, user_id, amount, created_at}) {
        this.id = id;
        this.auction_id = auction_id;
        this.user_id = user_id;
        this.amount = amount;
        this.created_at = created_at
    }
}
module.exports = {Auction, Bid}