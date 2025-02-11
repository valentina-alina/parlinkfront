// FixedHeader.tsx
import { Link } from 'react-router-dom';
import { Label } from 'flowbite-react';
import { MdOutlineApps } from 'react-icons/md';
import { HiViewList } from 'react-icons/hi';


type FixedHeaderProps = {
  categories: string[];
  selectedCategories: string[];
  isAllSelected: boolean;
  subCategories: Record<string, string[]>;
  handleCategoryChange: (category: string) => void;
  handleCategoryHover: (category: string) => void;
  handleSubCategoryChange: (subCategory: string) => void;
};

const FixedHeader: React.FC<FixedHeaderProps> = ({
  categories,
  selectedCategories,
  isAllSelected,
  subCategories,
  handleCategoryChange,
  handleCategoryHover,
  handleSubCategoryChange,
}) => {
  return (
    <div className=' fixed w-screen p-10 z-30 top-[80px] lg:w-[1200px] flex flex-row justify-between border-b-2 border-t-2 py-2 font-bodyTest bg-white border-gray-100'>
   {categories.map((category) => (
                    <div className="event_filter_wrapper relative group" key={category}>
                        <div className='relative'>
                            <Link
                                data-cy="category"
                                to=""
                                onClick={() => handleCategoryChange(category)}
                                onMouseEnter={() => handleCategoryHover(category)}
                                className='flex active:ring focus:outline-none focus:border-b-2 focus:border-b-blue-800'
                            >
                                <span className='active:before:block active:before:absolute active:before:-inset-1 active:before:-skew-y-3 active:before:bg-blue-700 active:relative active:inline-block hover:before:block hover:before:absolute hover:before:-inset-1 hover:before:-skew-y-3 hover:before:bg-blue-700 hover:relative hover:inline-block'>
                                    <Label
                                        htmlFor={category}
                                        className={`flex ${selectedCategories.includes(category) || (category === 'all' && isAllSelected) ? 'font-bold border-b-4 border-b-blue-800 active:relative active:text-white hover:relative hover:text-white text-xs sm:text-lg' : 'flex active:relative active:text-white hover:relative hover:text-white text-xs sm:text-lg'}`}
                                    >
                                        {category === 'all' ? 'Toutes' : category}
                                    </Label>
                                </span>
                            </Link>
                        </div>
                        {subCategories[category] && subCategories[category].length > 0 && category !== 'all' && (
                            <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md w-60 z-10 hidden group-hover:block">
                                {subCategories[category].map((subcategory, index) => (
                                    <Link
                                        to=""
                                        key={index}
                                        className="block px-3 py-1 text-sm text-gray-800 hover:bg-blue-700 hover:text-white ms-14 sm:ms-0"
                                        onClick={() => handleSubCategoryChange(subcategory)}
                                    >
                                        {subcategory}
                                    </Link>
                                ))}
                            </div>
                        )}
                        <p className={`${selectedCategories.includes(category) || (category === 'all' && isAllSelected) ? 'font-bold text-sm text-center' : 'font-light text-sm text-center'}`}>
                        </p>
                    </div>
                ))}
                <div className='flex justify-end items-center max-sm:hidden'>
                    <Link className='text-blue-800' to="/ads-grid">
                        <MdOutlineApps className='w-8 h-8 tex-blue-800' />
                    </Link>
                    <Link data-cy="adslist" className='text-blue-800' to="/ads-list">
                        <HiViewList className='w-8 h-8' />
                    </Link>
                </div>
    </div>
  );
};

export default FixedHeader;
