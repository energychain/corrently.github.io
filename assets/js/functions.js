$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return decodeURI(results[1]) || 0;
    }
}


const  cw = CorrentlyWallet.default;
const backend = "https://api.corrently.de/"


const getAccountInfo=function(address) {
  $('#acnt_fld').html('<h3><span class="address text-success"></span></h3>');
  $('.address').html(address);
  $('#changeAddress').show();
  $('#a').val(address);
  $.getJSON(backend+"totalSupply?account="+address,function(data) {
    console.log(data);
    if(data.result.ja!=0) {
      data.result.balance_capacity = (data.result.nominalCori/data.result.ja)*100;
    } else {
      data.result.balance_capacity = "-";
    }
    data.result.balance_kwh = (data.result.generation-data.result.meteredconsumption)*1;
    data.result.balance_corrently = (data.result.totalSupply-data.result.convertedSupply)*1;
    for (var k in data.result){
      if (data.result.hasOwnProperty(k)) {
        let v= data.result[k];
        if(typeof v == "number") {
          if(Math.abs(v)<0.0001) v=v.toFixed(6); else
          if(Math.abs(v)<0.001) v=v.toFixed(5); else
          if(Math.abs(v)<0.1) v=v.toFixed(4); else
          if(Math.abs(v)<10000000) v=v.toFixed(3); else {
          v=new Date(v).toLocaleString();
          }
        }
        $('.'+k).html(v);
      }
    }
    let html="";
    html+="<table class='table table-condensed'>";
    html+="<tr>";
    html+="<th>Date/Time</th>";
    html+="<th>Asset</th>";
    html+="<th>Corrently</th>";
    html+="<th>kWh/year</th>";
    html+="</tr>";
    data.result.txs=data.result.txs.reverse();
    for(var i=0;i<data.result.txs.length;i++) {
      html+="<tr>";
      html+="<td>"+new Date(data.result.txs[i].timeStamp).toLocaleString()+"</td>";
      html+="<td>"+data.result.txs[i].asset+"</td>";
      html+="<td>"+data.result.txs[i].corrently+"</td>";
      html+="<td>"+data.result.txs[i].cori+"</td>";
      html+="</tr>";
    }
    html+="</table>";
    $('#txs').html(html);
    console.log("HERE",data.result.nominalCori);
    if(data.result.nominalCori>0) {
      setTimeout(function() {
          getAccountInfo(address);
      },20000);
    }
  });
}
function openAccount() {
  if($('#a').val().length==66) {
    window.localStorage.setItem("privateKey",$('#a').val());
    wallet = new cw.Wallet(window.localStorage.getItem("privateKey"));
    getAccountInfo(wallet.address);
  } else {
    getAccountInfo($('#a').val());
  }
  return false;
}

$( document ).ready(function() {

  if((window.localStorage.getItem("privateKey")!=null)&&(window.localStorage.getItem("privateKey").length==66)) {
    wallet = new cw.Wallet(window.localStorage.getItem("privateKey"));
  } else {
    wallet = cw.Wallet.createRandom();
    window.localStorage.setItem("privateKey",wallet.privateKey);
  }
  if($.urlParam("a")==null) {
    $('.address').html(wallet.address);
    getAccountInfo(wallet.address);
  } else {
    $('.address').html($.urlParam("a"));
    getAccountInfo($.urlParam("a"));
  }
  $('#changeAddress').click(function() {
      $('#changeAddress').hide();
        let html="";
        html+="<form action='#' method='GET' onsubmit='return openAccount();'><div class='form-group>'>";
        html+="<label for='a'>Address or PrivateKey</label>";
        html+="<input class='form-control' type='text' length='60' id='a' name='a' value='"+$('.address').html()+"'/>";
        html+="<button type='button' id='resetBtn' class='btn btn-warning btn-sm' style='margin-right:5px;'>reset (logout)</button>";
        html+="<button type='submit' class='btn btn-danger btn-sm'>open</button>";
        html+="</div></form>";
        $('#acnt_fld').html(html);
        $('#resetBtn').click(function() {
          wallet = cw.Wallet.createRandom();
          window.localStorage.setItem("privateKey",wallet.privateKey);
          location.reload();
        });
  });
  if(location.pathname.indexOf("market.html")>0) {
    cw.Market().then(function(market) {
        let html="";
        html+="<table class='table table-condensed'>";
        console.log(market);
        for(var i=0;i<market.length;i++) {
            html+="<tr>";
            html+="<td>"+market[i].title+"</td>";
            html+="<td>"+market[i].emitent+"</td>";
            html+="<td>"+market[i].decom+"</td>";
            html+="<td><button class='btn btn-success btn-sm buybtn' data-asset='"+market[i].asset+"'  data-contract='"+market[i].contract+"'>Get 1 kWh/year for "+market[i].cori+" Corrently</button></td>";
            html+="</tr>";
        }
        html+="</table>";
        $('#market').html(html);
        $('.buybtn').click(function(e) {
            $('.buybtn').attr('disabled','disabled');
            wallet.buyCapacity({asset:$(e.currentTarget).attr('data-asset'),contract:$(e.currentTarget).attr('data-contract')}, 1).then(function(transaction) {
                location.href="/";
            });
        });
    });
  }
});
