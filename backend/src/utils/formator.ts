export const slugtify = (text : string) => { // có 2 cách: 1 là dùng code chay. hoặc có thể sử dunhj thuật toán
    if (!text) return ''
    return String(text)
        .toString()
        .normalize('NFKD') // chuyển hoá unicode (tách ê thành e + tách dấu ^)
        .replace(/[\u0300-\u036f]/g, '') // xóa dấu ^ và thành kiên -> kien 
        .replace(/đ/g, 'd') // chuyển đ → d
        .replace(/Đ/g, 'D')
        .toLowerCase() // chuyển thành chữ thường
        .trim() // xoá khoản trắng ở đầu hoặc cuối chuỗi. " hello world " → "hello world".
        .replace(/\s+/g, '-') //\s = space, tab, xuống dòng
        .replace(/[^\w\-]+/g, '') //Dùng để loại bỏ dấu câu, ký tự đặc biệt. Ví 
        .replace(/\-\-+/g, '-') //nghĩa là tìm nhiều dấu - liên tiếp và thay bằng 1 dấudụ: "node!js?" → "nodejs". -. Ví dụ: "hoc---nodejs" → "hoc-nodejs".
}

// const origin = 'XIn chào mình tên là võ trung kiên rất vui được làm quen với bạn hehehehehe'
// const slug = slugtify(origin)

// console.log(`Original content: ${origin}`)
// console.log(`Converted content: ${slug}`)