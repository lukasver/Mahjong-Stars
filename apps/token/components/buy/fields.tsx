/**
 * Title displays a section title with an optional icon.
 */
export const Title = ({
  title,
  icon,
  render = true,
}: {
  title: string;
  icon?: React.ReactNode;
  render?: boolean;
}) => {
  if (!render) return null;
  return (
    <div className='flex items-center gap-2 mb-2'>
      {icon}
      <h3 className='text-xl font-bold'>{title}</h3>
    </div>
  );
};

/**
 * Field displays a label and content in a horizontal row.
 */
export const Field = ({
  title,
  content,
  render = true,
}: {
  title: string;
  content: React.ReactNode;
  render?: boolean;
}) => {
  if (!render) return null;
  return (
    <div className='flex w-full'>
      <span className='w-[58%] text-base font-semibold text-left'>{title}</span>
      <span className='w-[42%] text-base text-right text-foreground break-words'>
        {content}
      </span>
    </div>
  );
};

/**
 * FieldDescription displays a field title and a description/content below it.
 */
export const FieldDescription = ({
  title,
  content,
  render = true,
}: {
  title?: string;
  content?: React.ReactNode;
  render?: boolean;
}) => {
  if (!render) return null;
  return (
    <div>
      {title && (
        <div className='pb-1 mt-1 text-lg font-bold text-left'>{title}</div>
      )}
      {content && (
        <div className='pb-2 mt-1 text-base text-foreground text-justify break-words whitespace-pre-wrap'>
          {content}
        </div>
      )}
    </div>
  );
};
