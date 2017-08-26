$(document).ready(function() {

    var $wrapper = $('#wrapper');
    var $color = $('#color');
    var $slider = $('#slider');

    $slider.css('left', 0 + 'px');
    $color.css('width', 0 + 'px');

    $(document).on('mouseover', () => { //press slider
        $wrapper.on('mousemove', (e) => { //makes slider draggable

            var y = e.pageX;
            $slider.css('left', y + 'px');
            $color.css('width', y + 'px');

        });
    });

    $('.x').on('click', () => {
        function close(){
            location.href='/thanks';
        }
        close().delay();
    });

    $('.view-signees-button').on('click', () => {
        $('.view-all').css({ backgroundColor: 'tomato' })
    })

});
