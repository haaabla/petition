const canvas = document.getElementById("canvas");

if (canvas) {
    const context = canvas.getContext("2d");

    $('#canvas').on('mousedown', function(e){
        e.preventDefault();
        context.moveTo(e.offsetX, e.offsetY);
        $('#canvas').on('mousemove', function(e){
            context.lineTo(e.offsetX, e.offsetY);
            context.stroke();
        }).on('mouseup', function(){
            $('#canvas').off('mousemove');
            $('#hiddencanvas').val(canvas.toDataURL());
        });
    });

}
