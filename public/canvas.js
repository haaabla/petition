const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

console.log('outside JS');

$('#canvas').on('mousedown', function(e){
    e.preventDefault();
    context.moveTo(e.offsetX, e.offsetY);
    $('#canvas').on('mousemove', function(e){
        context.lineTo(e.offsetX, e.offsetY);
        context.stroke();
    }).on('mouseup', function(){
        $('#canvas').off('mousemove');
        console.log(canvas.toDataURL().length); //base is 3694
        $('#hiddencanvas').val(canvas.toDataURL());
    });
});

$('#clear').on('click', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
});

// $('#button').css('opacity', '0.2');
